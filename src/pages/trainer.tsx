import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type ChessOpening from '@/lib/chess-opening';
import { OPENINGS } from '@/lib/openings';
import { RuyLopez } from '@/lib/openings/ruy-lopez/ruy-lopez';
import { Chess, type Square } from 'chess.js';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useState } from 'react';
import { Chessboard } from 'react-chessboard';

type GameMode = 'Bust' | 'Explore';

export const ChessOpeningTrainer = () => {
  const [game] = useState(new Chess());
  const [currentOpening, setCurrentOpening] = useState<ChessOpening>(RuyLopez);
  const [message, setMessage] = useState({ type: 'info', content: 'Click on a piece and then click on a square to make a move.' });
  const [highlightSquares, setHighlightSquares] = useState({});
  const [arrows, setArrows] = useState<[Square, Square, string][]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('Explore');
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [variationName, setVariationName] = useState<string | undefined>();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const resetGame = (opening: ChessOpening) => {
    game.reset();

    setHighlightSquares({});
    setArrows([]);
    setMessage({ type: 'info', content: 'Click on a piece and then click on a square to make a move.' });
    setVariationName('');

    if (opening.playerColor === 'black') {
      makeOpponentMove();
    } else {
      setIsProcessingMove(false);
    }
  };

  const makeMove = (move: { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' } | string) => {
    const result = game.move(move);

    if (game.moveNumber() > 5) {
      const variation = currentOpening.dag.getCurrentLineName(game.fen());
      if (variation) {
        setVariationName(variation);
      }
    }

    return result;
  };

  const makeOpponentMove = () => {
    const currentFen = game.fen();
    const opponentMove = currentOpening.getRandomMove(currentFen);

    setIsProcessingMove(true);

    if (!opponentMove) {
      setMessage({ type: 'success', content: 'You have successfully completed the opening line!' });
      return resetGame(currentOpening);
    }

    setTimeout(() => {
      setArrows([]);
      setHighlightSquares({});
      const move = makeMove(opponentMove);
      setMessage({ type: 'info', content: `Opponent played: ${move.san}` });
      setIsProcessingMove(false);

      const correctMoves = currentOpening.getNextMoves(move.after);
      if (correctMoves.length === 0) {
        setMessage({ type: 'success', content: 'You have successfully completed the opening line!' });
        return resetGame(currentOpening);
      }
    }, 500);
  };
  const highlightPossibleMove = (square: Square) => {
    const moves = game.moves({ square, verbose: true });

    if (moves.length > 0) {
      setSelectedSquare(square);

      const highlights: { [K in Square]?: { backgroundColor: string } } = {};
      for (const move of moves) {
        highlights[move.to] = { backgroundColor: 'rgba(0, 255, 0, 0.3)' };
      }
      setHighlightSquares(highlights);
    } else {
      setSelectedSquare(null);
      setHighlightSquares({});
    }
  };

  const highlightCorrectMove = (fen: string) => {
    const correctMove = currentOpening.getNextMoves(fen);

    const highlights: { [K in Square]?: { backgroundColor: string } } = {};
    const arrows: [Square, Square, string][] = [];
    for (const move of correctMove) {
      const fakeGame = new Chess(fen);
      const moveResult = fakeGame.move(move);
      highlights[moveResult?.to] = { backgroundColor: 'rgba(255, 0, 0, 0.3)' };
      highlights[moveResult?.from] = { backgroundColor: 'rgba(255, 0, 0, 0.3)' };

      arrows.push([moveResult?.from, moveResult?.to, 'red']);
    }

    setArrows(arrows);
    setHighlightSquares(highlights);
  };

  const handleMistake = (previousFen: string) => {
    setMessage({ type: 'error', content: 'Mistake! That move is not part of the opening line.' });
    highlightCorrectMove(previousFen);
    setIsProcessingMove(true);

    if (gameMode === 'Bust') {
      setTimeout(() => resetGame(currentOpening), 1500);
    } else {
      // Explore mode
      setTimeout(() => {
        game.load(previousFen);
        setHighlightSquares({});
        setArrows([]);
        setMessage({ type: 'info', content: "Let's try that move again." });
        setIsProcessingMove(false);
      }, 1500);
    }
  };
  const handleSquareClick = (square: Square) => {
    const currentFen = game.fen();
    if (isProcessingMove) return false;

    if (selectedSquare && highlightSquares[square]) {
      const moveResult = makeMove({
        from: selectedSquare,
        to: square,
        promotion: 'q',
      });

      if (moveResult === null) return;

      const correctMoves = currentOpening.getNextMoves(currentFen);
      if (correctMoves.includes(moveResult.san)) {
        setMessage({ type: 'success', content: 'Correct move!' });
        makeOpponentMove();
      } else {
        handleMistake(moveResult.before);
      }
      setSelectedSquare(null);
      setHighlightSquares({});
    } else {
      highlightPossibleMove(square);
    }
  };

  const onDrop = (sourceSquare: Square, targetSquare: Square) => {
    const currentFen = game.fen();

    if (isProcessingMove) return false;

    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to queen for simplicity
    });

    if (move === null) return false;

    const correctMoves = currentOpening.getNextMoves(currentFen);

    if (!correctMoves.includes(move.san)) {
      handleMistake(move.before);
      return true;
    }

    correctMoves.splice(correctMoves.indexOf(move.san), 1);

    if (correctMoves.length) {
      const arrows: [Square, Square, string][] = [];
      for (const correctMove of correctMoves) {
        const fakeGame = new Chess(currentFen);
        const moveResult = fakeGame.move(correctMove);
        arrows.push([moveResult?.from, moveResult?.to, 'lightblue']);
      }

      setArrows(arrows);
    }

    setMessage({ type: 'success', content: 'Correct move!' });
    makeOpponentMove();

    return true;
  };

  const handleSelectOpening = (opening: string) => {
    const selectedOpening = OPENINGS.find((o) => o.name === opening);
    if (selectedOpening) {
      setCurrentOpening(selectedOpening);
      resetGame(selectedOpening);
    }
  };

  return (
    <div className="container px-8 flex flex-col items-center justify-center m-auto">
      <h1 className="text-3xl font-bold mb-4">Advanced Chess Opening Trainer</h1>
      <div className="grid grid-cols-1 border border-gray-200 p-4 rounded-lg">
        <Select onValueChange={handleSelectOpening} value={currentOpening.name}>
          <SelectTrigger className="w-full mb-4">
            <SelectValue placeholder="Select an opening" />
          </SelectTrigger>
          <SelectContent>
            {OPENINGS.map((opening) => (
              <SelectItem key={opening.name} value={opening.name}>
                {opening.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Switch id="game-mode" checked={gameMode === 'Explore'} onCheckedChange={(checked) => setGameMode(checked ? 'Explore' : 'Bust')} />
            <Label htmlFor="game-mode">Mode: {gameMode}</Label>
          </div>
          <div className="w-full max-w-[500px] mx-auto">
            <Chessboard
              customArrows={arrows}
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={handleSquareClick}
              boardOrientation={currentOpening.playerColor}
              customSquareStyles={highlightSquares}
            />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          {message.content && (
            <Alert
              className={`mb-4 rounded-t-none ${message.type === 'error' ? 'bg-destructive/15' : message.type === 'success' ? 'bg-green-200' : 'bg-secondary/15'}`}
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
          <Button onClick={() => resetGame(currentOpening)} className="mb-4">
            Reset Game
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <span>Variation: {variationName || 'Main Line'}</span>
        </div>
      </div>
    </div>
  );
};
