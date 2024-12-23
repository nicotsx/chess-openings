import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { OPENING_LINES, type Opening } from '@/lib/lines';
import { Chess, type Square } from 'chess.js';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Chessboard } from 'react-chessboard';

type GameMode = 'Bust' | 'Explore';

export const ChessOpeningTrainer = () => {
  const [game, setGame] = useState(new Chess());
  const [currentOpening, setCurrentOpening] = useState<Opening>('Ruy Lopez');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [highlightSquares, setHighlightSquares] = useState({});
  const [gameMode, setGameMode] = useState<GameMode>('Bust');
  const [isProcessingMove, setIsProcessingMove] = useState(false);

  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setHighlightSquares({});
    setIsProcessingMove(false);
  }, []);

  const makeMove = useCallback(
    (move: { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' } | string) => {
      const result = game.move(move);
      return result;
    },
    [game],
  );

  const makeOpponentMove = () => {
    const currentFen = game.fen();
    const currentLine = OPENING_LINES[currentOpening];
    const opponentMove = currentLine.getRandomMove(currentFen);

    setIsProcessingMove(true);

    if (!opponentMove) {
      setMessage({ type: 'success', content: 'You have successfully completed the opening line!' });
      return resetGame();
    }

    setTimeout(() => {
      const move = makeMove(opponentMove);
      setMessage({ type: 'info', content: `Opponent played: ${move.san}` });
      setIsProcessingMove(false);
    }, 500);
  };

  const highlightPossibleMove = (square: Square) => {
    const moves = game.moves({ square, verbose: true });

    const highlights: { [K in Square]?: { backgroundColor: string } } = {};

    for (const move of moves) {
      highlights[move.to] = { backgroundColor: 'rgba(0, 255, 0, 0.3)' };
    }

    setHighlightSquares(highlights);
  };

  const highlightCorrectMove = (fen: string) => {
    const currentLine = OPENING_LINES[currentOpening];
    const correctMove = currentLine.getNextMoves(fen)[0];

    if (correctMove) {
      const currentFen = game.fen();
      game.undo();
      const move = game.move(correctMove, { strict: true });
      game.load(currentFen);
      setHighlightSquares({
        [move.from]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' },
        [move.to]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' },
      });
    }
  };

  const handleMistake = (previousFen: string) => {
    setMessage({ type: 'error', content: 'Mistake! That move is not part of the opening line.' });
    highlightCorrectMove(previousFen);
    setIsProcessingMove(true);

    if (gameMode === 'Bust') {
      setTimeout(resetGame, 1500);
    } else {
      // Explore mode
      setTimeout(() => {
        const gameCopy = new Chess(previousFen);
        setGame(gameCopy);
        setHighlightSquares({});
        setMessage({ type: 'info', content: "Let's try that move again." });
        setIsProcessingMove(false);
      }, 1500);
    }
  };

  const onDrop = (sourceSquare: Square, targetSquare: Square) => {
    const currentFen = game.fen();

    if (isProcessingMove) return false;

    const currentLine = OPENING_LINES[currentOpening];

    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to queen for simplicity
    });

    if (move === null) return false;

    const correctMoves = currentLine.getNextMoves(currentFen);

    if (!correctMoves.includes(move.san)) {
      handleMistake(move.before);
      return true;
    }

    setHighlightSquares({});
    setMessage({ type: 'success', content: 'Correct move!' });
    makeOpponentMove();

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
              onSquareClick={(square) => highlightPossibleMove(square)}
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
          <div>
            <h2 className="text-xl font-semibold mb-2">Current Opening: {currentOpening}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};
