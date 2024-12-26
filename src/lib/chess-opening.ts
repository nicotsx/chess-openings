import { Chess } from 'chess.js';
import ChessOpeningDAG, { type Line } from './openings-dag';

type PlayerColor = 'white' | 'black';

/**
 * Represents a chess opening with metadata and a DAG of positions.
 */
class ChessOpening {
  name: string;
  playerColor: PlayerColor;
  initialPosition: string;
  dag: ChessOpeningDAG;

  /**
   * Creates a new ChessOpening.
   * @param name The name of the opening (e.g., "Ruy Lopez").
   * @param playerColor The player color for the opening (white/black).
   * @param initialPosition The FEN string of the initial position (default is standard chess start).
   */
  constructor(name: string, playerColor: PlayerColor, data: { lines: Line[] }, initialPosition = 'start') {
    this.name = name;
    this.playerColor = playerColor;

    if (initialPosition === 'start') {
      this.initialPosition = new Chess().fen();
    } else {
      this.initialPosition = initialPosition;
    }

    this.dag = new ChessOpeningDAG();
    this.dag.addLines(data.lines);
  }

  /**
   * Get all possible next moves from a given FEN.
   * If no FEN is provided, uses the opening's initial position.
   * @param fen Optional FEN to query; defaults to the initial position.
   */
  getNextMoves(fen: string = this.initialPosition) {
    return this.dag.getNextMoves(fen);
  }

  /**
   * Get a random next move from a given FEN.
   * If no FEN is provided, uses the opening's initial position.
   * @param fen Optional FEN to query; defaults to the initial position.
   */
  getRandomMove(fen: string = this.initialPosition) {
    return this.dag.getRandomMove(fen);
  }
}

export default ChessOpening;
