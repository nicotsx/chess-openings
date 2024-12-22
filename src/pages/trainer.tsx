import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { OPENING_LINES, type Opening } from '@/lib/chess';
import { Chess, type Square } from 'chess.js';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';

type GameMode = 'Bust' | 'Explore';

export const ChessOpeningTrainer = () => {
  const [game, setGame] = useState(new Chess());
  const [currentOpening, setCurrentOpening] = useState<Opening>('Ruy Lopez (Main Line)');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [highlightSquares, setHighlightSquares] = useState({});
  const [gameMode, setGameMode] = useState<GameMode>('Bust');
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [lastCorrectFen, setLastCorrectFen] = useState('');

  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setCurrentMoveIndex(0);
    setMessage({ type: '', content: '' });
    setHighlightSquares({});
    setIsProcessingMove(false);
    setLastCorrectFen('');
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    if (currentOpening && currentMoveIndex < OPENING_LINES[currentOpening].length && !isProcessingMove) {
      const isPlayerTurn = currentMoveIndex % 2 === 0;
      if (!isPlayerTurn) {
        makeOpponentMove();
      }
    }
  }, [currentOpening, currentMoveIndex, isProcessingMove]);

  const makeMove = useCallback(
    (move: { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' } | string) => {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(move);
      setGame(gameCopy);
      return result;
    },
    [game],
  );

  const makeOpponentMove = () => {
    const currentLine = OPENING_LINES[currentOpening];
    let opponentMove = currentLine[currentMoveIndex];

    if (Array.isArray(opponentMove)) {
      opponentMove = opponentMove[Math.floor(Math.random() * opponentMove.length)];
    }

    setIsProcessingMove(true);
    setTimeout(() => {
      const move = makeMove(opponentMove as string);
      setCurrentMoveIndex((prevIndex) => prevIndex + 1);
      setMessage({ type: 'info', content: `Opponent played: ${move.san}` });
      setLastCorrectFen(game.fen());
      setIsProcessingMove(false);
    }, 500);
  };

  const highlightPossibleMove = (square: Square) => {
    const moves = game.moves({ square, verbose: true }); // Get all possible moves from the square

    const highlights: Record<Square, { backgroundColor: string }> = {};
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      highlights[move.to] = { backgroundColor: 'rgba(0, 255, 0, 0.5)' }; // Highlight possible target squares
    }

    setHighlightSquares(highlights);
  };
  const highlightCorrectMove = () => {
    const currentLine = OPENING_LINES[currentOpening];
    let correctMove = currentLine[currentMoveIndex];

    if (Array.isArray(correctMove)) {
      correctMove = correctMove[0]; // Highlight the first variant as correct
    }

    const move = game.move(correctMove as string);
    game.undo(); // Undo the move to keep the game state correct
    setHighlightSquares({
      [move.from]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' },
      [move.to]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' },
    });
  };

  const handleMistake = () => {
    setMessage({ type: 'error', content: 'Mistake! That move is not part of the opening line.' });
    highlightCorrectMove();

    setIsProcessingMove(true);
    if (gameMode === 'Bust') {
      setTimeout(resetGame, 1500);
    } else {
      // Explore mode
      setTimeout(() => {
        if (lastCorrectFen) {
          const gameCopy = new Chess(lastCorrectFen);
          setGame(gameCopy);
          setCurrentMoveIndex((prevIndex) => prevIndex - 1); // Reset the move index
        } else {
          const gameCopy = new Chess(game.fen());
          gameCopy.undo();
          setGame(gameCopy);
        }
        setHighlightSquares({});
        setMessage({ type: 'info', content: "Let's try that move again." });
        setIsProcessingMove(false);
      }, 1500);
    }
  };

  const onDrop = (sourceSquare: Square, targetSquare: Square) => {
    if (isProcessingMove) return false;

    const currentLine = OPENING_LINES[currentOpening];
    if (!currentLine || currentMoveIndex >= currentLine.length) return false;

    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to queen for simplicity
    });

    if (move === null) return false;

    const correctMove = currentLine[currentMoveIndex];
    if (Array.isArray(correctMove)) {
      if (!correctMove.includes(move.san)) {
        handleMistake();
        return true;
      }
    } else if (move.san !== correctMove) {
      handleMistake();
      return true;
    }

    setHighlightSquares({});
    setCurrentMoveIndex((prevIndex) => prevIndex + 1);
    setMessage({ type: 'success', content: 'Correct move!' });
    setLastCorrectFen(game.fen());

    return true;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Advanced Chess Opening Trainer</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select onValueChange={(o) => setCurrentOpening(o as Opening)} value={currentOpening}>
            <SelectTrigger className="w-full mb-4">
              <SelectValue placeholder="Select an opening" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(OPENING_LINES).map((opening) => (
                <SelectItem key={opening} value={opening}>
                  {opening}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2 mb-4">
            <Switch id="game-mode" checked={gameMode === 'Explore'} onCheckedChange={(checked) => setGameMode(checked ? 'Explore' : 'Bust')} />
            <Label htmlFor="game-mode">Mode: {gameMode}</Label>
          </div>
          <div className="w-full max-w-[500px] mx-auto">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={(square) => highlightPossibleMove(square)} // Add this handler
              boardOrientation="white"
              customSquareStyles={highlightSquares}
            />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          {message.content && (
            <Alert
              className={`mb-4 ${message.type === 'error' ? 'bg-destructive/15' : message.type === 'success' ? 'bg-primary/15' : 'bg-secondary/15'}`}
            >
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
              <AlertTitle>{message.type.charAt(0).toUpperCase() + message.type.slice(1)}</AlertTitle>
              <AlertDescription>{message.content}</AlertDescription>
            </Alert>
          )}
          <Button onClick={resetGame} className="mb-4">
            Reset Game
          </Button>
          {currentOpening && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Current Opening: {currentOpening}</h2>
              <p className="mb-2">
                Progress: {currentMoveIndex} / {OPENING_LINES[currentOpening].length} moves
              </p>
              <p>Next move: {currentMoveIndex % 2 === 0 ? 'Your turn' : "Opponent's turn"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
