import { Chess } from 'chess.js';

export type Line = { name: string; moves: string[] };

/**
 * Represents a single node (position) in the DAG.
 */
class DAGNode {
  fen: string;
  moves: Record<string, string>;

  constructor(fen: string) {
    this.fen = fen;
    this.moves = {};
  }
}

/**
 * ChessOpeningDAG manages the directed acyclic graph of positions (FENs).
 */
class ChessOpeningDAG {
  nodes: Record<string, DAGNode>;
  chess: Chess;
  fenToLineName: Record<string, string>;

  constructor() {
    this.nodes = {};
    this.fenToLineName = {};
    this.chess = new Chess();
    const startFen = this.chess.fen();

    // Create the root node if not present
    this.nodes[startFen] = new DAGNode(startFen);
    this.fenToLineName[startFen] = 'Root';
  }

  addLines(lines: Line[]) {
    for (const line of lines) {
      this.addLine(line.moves, line.name);
    }
  }

  /**
   * Add a single line (array of moves) to the DAG.
   * example: ["e4", "e5", "Nf3", "Nc6", "Bb5", ...]
   */
  addLine(movesArray: string[], lineName: string) {
    this.chess.reset();
    let currentFen = this.chess.fen();

    if (!this.nodes[currentFen]) {
      this.nodes[currentFen] = new DAGNode(currentFen);
    }

    for (const move of movesArray) {
      const moveResult = this.chess.move(move);
      if (!moveResult) {
        throw new Error(`Invalid move '${move}' from FEN: ${currentFen}`);
      }

      const childFen = this.chess.fen();

      if (!this.nodes[childFen]) {
        this.nodes[childFen] = new DAGNode(childFen);
      }

      // Link currentFen -> childFen via moveStr
      const node = this.nodes[currentFen];
      if (node) {
        node.moves[move] = childFen;
      }

      // Assign the line name to the FEN if it doesn't already have one
      if (!this.fenToLineName[childFen]) {
        this.fenToLineName[childFen] = lineName;
      }

      currentFen = childFen;
    }
  }

  /**
   * Given a fen, return all possible next moves (string array).
   */
  getNextMoves(fen: string) {
    const node = this.nodes[fen];
    if (!node) return [];

    return Object.keys(node.moves);
  }

  /**
   * Pick a random next move from the given fen.
   * Returns null if there are no possible moves.
   */
  getRandomMove(fen: string) {
    const moves = this.getNextMoves(fen);
    if (moves.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }

  /**
   * Get the name of the current line based on the sequence of moves.
   */
  getCurrentLineName(fen: string) {
    return this.fenToLineName[fen];
  }
}

export default ChessOpeningDAG;
