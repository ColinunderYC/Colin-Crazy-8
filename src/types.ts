export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface CardData {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

export type GameStatus = 'waiting' | 'playing' | 'gameOver';
export type PlayerType = 'player' | 'ai';

export interface GameState {
  deck: CardData[];
  discardPile: CardData[];
  playerHand: CardData[];
  aiHand: CardData[];
  currentTurn: PlayerType;
  status: GameStatus;
  winner: PlayerType | null;
  currentSuit: Suit | null; // For when an 8 is played
  isSuitSelecting: boolean;
}
