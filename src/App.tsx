import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  User, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { CardData, GameState, PlayerType, Suit } from './types';
import { createDeck, SUIT_COLORS, SUIT_SYMBOLS, SUITS, SUIT_NAMES_CN } from './constants';

interface CardProps {
  card: CardData;
  isFaceUp?: boolean;
  onClick?: () => void;
  onPeek?: (card: CardData) => void;
  isPlayable?: boolean;
  className?: string;
  key?: React.Key;
}

const Card = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  onPeek,
  isPlayable = false,
  className = "" 
}: CardProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (isPlayable && onClick) {
      onClick();
    } else if (onPeek) {
      onPeek(card);
    }
  };

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      whileHover={isPlayable ? { y: -10, scale: 1.05 } : { scale: 1.02 }}
      onClick={handleClick}
      className={`relative w-24 h-36 sm:w-28 sm:h-40 rounded-xl shadow-lg flex flex-col items-center justify-center cursor-pointer select-none transition-shadow ${
        isFaceUp ? 'bg-white border border-slate-200' : 'bg-indigo-600 border-2 border-white/20'
      } ${isPlayable ? 'ring-2 ring-emerald-400 shadow-emerald-200/50' : ''} ${className}`}
    >
      {isFaceUp ? (
        <>
          <div className={`absolute top-2 left-2 text-lg font-bold ${SUIT_COLORS[card.suit]}`}>
            {card.rank}
          </div>
          <div className={`text-4xl ${SUIT_COLORS[card.suit]}`}>
            {SUIT_SYMBOLS[card.suit]}
          </div>
          <div className={`absolute bottom-2 right-2 text-lg font-bold rotate-180 ${SUIT_COLORS[card.suit]}`}>
            {card.rank}
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-24 border-2 border-white/20 rounded-lg flex items-center justify-center">
            <Layers className="text-white/40 w-8 h-8" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [game, setGame] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentTurn: 'player',
    status: 'waiting',
    winner: null,
    currentSuit: null,
    isSuitSelecting: false,
  });

  const [message, setMessage] = useState("Welcome to Colin Crazy Eights!");
  const [toast, setToast] = useState<{ message: string; suit: Suit } | null>(null);

  const showCardInfo = (card: CardData) => {
    setToast({ 
      message: `这张牌的花色是：${SUIT_NAMES_CN[card.suit]}`, 
      suit: card.suit 
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const initGame = useCallback(() => {
    const fullDeck = createDeck();
    const playerHand = fullDeck.splice(0, 8);
    const aiHand = fullDeck.splice(0, 8);
    const firstDiscard = fullDeck.pop()!;
    
    setGame({
      deck: fullDeck,
      discardPile: [firstDiscard],
      playerHand,
      aiHand,
      currentTurn: 'player',
      status: 'playing',
      winner: null,
      currentSuit: firstDiscard.suit,
      isSuitSelecting: false,
    });
    setMessage("Your turn! Match the suit or rank.");
  }, []);

  useEffect(() => {
    if (game.status === 'waiting') {
      initGame();
    }
  }, [game.status, initGame]);

  const checkWinner = (gameState: GameState) => {
    if (gameState.playerHand.length === 0) {
      return { ...gameState, status: 'gameOver' as const, winner: 'player' as const };
    }
    if (gameState.aiHand.length === 0) {
      return { ...gameState, status: 'gameOver' as const, winner: 'ai' as const };
    }
    return gameState;
  };

  const isCardPlayable = (card: CardData) => {
    if (game.currentTurn !== 'player' || game.isSuitSelecting) return false;
    const topCard = game.discardPile[game.discardPile.length - 1];
    if (card.rank === '8') return true;
    return card.suit === game.currentSuit || card.rank === topCard.rank;
  };

  const playCard = (card: CardData, player: PlayerType) => {
    setGame(prev => {
      const handKey = player === 'player' ? 'playerHand' : 'aiHand';
      const newHand = prev[handKey].filter(c => c.id !== card.id);
      const newDiscardPile = [...prev.discardPile, card];
      
      let nextState: GameState = {
        ...prev,
        [handKey]: newHand,
        discardPile: newDiscardPile,
        currentSuit: card.suit,
      };

      if (card.rank === '8') {
        if (player === 'player') {
          return { ...nextState, isSuitSelecting: true };
        } else {
          // AI Logic for choosing suit: pick the suit it has most of
          const suitCounts = nextState.aiHand.reduce((acc, c) => {
            acc[c.suit] = (acc[c.suit] || 0) + 1;
            return acc;
          }, {} as Record<Suit, number>);
          
          let bestSuit: Suit = 'hearts';
          let maxCount = -1;
          SUITS.forEach(s => {
            if ((suitCounts[s] || 0) > maxCount) {
              maxCount = suitCounts[s] || 0;
              bestSuit = s;
            }
          });
          
          return checkWinner({
            ...nextState,
            currentSuit: bestSuit,
            currentTurn: 'player',
          });
        }
      }

      return checkWinner({
        ...nextState,
        currentTurn: player === 'player' ? 'ai' : 'player',
      });
    });

    if (card.rank !== '8') {
      setMessage(player === 'player' ? "AI is thinking..." : "Your turn!");
    } else if (player === 'player') {
      setMessage("Wild card! Choose a new suit.");
    }
  };

  const drawCard = (player: PlayerType) => {
    if (game.deck.length === 0) {
      setMessage("Deck is empty! Skipping turn.");
      setGame(prev => ({
        ...prev,
        currentTurn: player === 'player' ? 'ai' : 'player'
      }));
      return;
    }

    setGame(prev => {
      const newDeck = [...prev.deck];
      const drawnCard = newDeck.pop()!;
      const handKey = player === 'player' ? 'playerHand' : 'aiHand';
      
      return {
        ...prev,
        deck: newDeck,
        [handKey]: [...prev[handKey], drawnCard],
        currentTurn: player === 'player' ? 'ai' : 'player'
      };
    });
    
    setMessage(player === 'player' ? "You drew a card. AI's turn." : "AI drew a card. Your turn!");
  };

  // AI Turn Logic
  useEffect(() => {
    if (game.status === 'playing' && game.currentTurn === 'ai' && !game.isSuitSelecting) {
      const timer = setTimeout(() => {
        const topCard = game.discardPile[game.discardPile.length - 1];
        const playableCards = game.aiHand.filter(c => 
          c.rank === '8' || c.suit === game.currentSuit || c.rank === topCard.rank
        );

        if (playableCards.length > 0) {
          // Simple AI strategy: play non-8 cards first
          const nonEight = playableCards.find(c => c.rank !== '8');
          const cardToPlay = nonEight || playableCards[0];
          playCard(cardToPlay, 'ai');
        } else {
          drawCard('ai');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [game.currentTurn, game.status, game.discardPile, game.currentSuit, game.isSuitSelecting]);

  const handleSuitSelect = (suit: Suit) => {
    setGame(prev => checkWinner({
      ...prev,
      currentSuit: suit,
      isSuitSelecting: false,
      currentTurn: 'ai'
    }));
    setMessage(`Suit changed to ${suit.toUpperCase()}. AI's turn.`);
  };

  const topDiscard = game.discardPile[game.discardPile.length - 1];

  return (
    <div className="min-h-screen bg-emerald-950 text-white font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col relative">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Layered Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.15),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(5,150,105,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(6,78,59,0.2),transparent_50%)]"></div>
        
        {/* Animated Floating Suits */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%", 
              opacity: 0.03 + Math.random() * 0.07,
              rotate: Math.random() * 360,
              scale: 0.5 + Math.random() * 1.5
            }}
            animate={{ 
              y: [null, (Math.random() * 100 - 50) + "%"],
              rotate: [null, Math.random() * 360],
            }}
            transition={{ 
              duration: 20 + Math.random() * 40, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute text-8xl font-serif select-none"
          >
            {SUIT_SYMBOLS[SUITS[i % 4]]}
          </motion.div>
        ))}

        {/* Subtle Grid/Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ 
          backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
          backgroundSize: '100px 100px' 
        }}></div>
      </div>
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Layers className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Colin Crazy 8s</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">{game.aiHand.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">{game.playerHand.length}</span>
          </div>
          <button 
            onClick={() => setGame(prev => ({ ...prev, status: 'waiting' }))}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 relative flex flex-col items-center justify-between p-4 sm:p-8 max-w-6xl mx-auto w-full">
        
        {/* AI Hand */}
        <div className="w-full flex justify-center h-32 sm:h-40">
          <div className="flex -space-x-12 sm:-space-x-16 hover:space-x-2 transition-all duration-300">
            <AnimatePresence>
              {game.aiHand.map((card, index) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  isFaceUp={false} 
                  className="z-0"
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Area (Deck & Discard) */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-8 sm:gap-16">
            {/* Draw Pile */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-emerald-400/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div 
                onClick={() => game.currentTurn === 'player' && !game.isSuitSelecting && drawCard('player')}
                className={`relative w-24 h-36 sm:w-28 sm:h-40 bg-indigo-700 rounded-xl border-2 border-white/20 shadow-2xl flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 ${
                  game.currentTurn === 'player' && !game.isSuitSelecting ? 'hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <Layers className="text-white/40 w-10 h-10 mb-2" />
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Draw</span>
                <div className="absolute bottom-2 right-3 text-xs font-mono text-white/40">
                  {game.deck.length}
                </div>
              </div>
            </div>

            {/* Discard Pile */}
            <div className="relative">
              <AnimatePresence mode="popLayout">
                {topDiscard && (
                  <Card 
                    key={topDiscard.id} 
                    card={topDiscard} 
                    className="shadow-2xl ring-4 ring-white/10"
                  />
                )}
              </AnimatePresence>
              {game.currentSuit && game.currentSuit !== topDiscard?.suit && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-emerald-500"
                >
                  <span className={`text-xl ${SUIT_COLORS[game.currentSuit]}`}>
                    {SUIT_SYMBOLS[game.currentSuit]}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-black/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-3">
            {game.currentTurn === 'player' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
            )}
            <p className="text-sm font-medium tracking-wide">{message}</p>
          </div>
        </div>

        {/* Player Hand */}
        <div className="w-full flex justify-center h-48 sm:h-56">
          <div className="flex -space-x-12 sm:-space-x-16 hover:space-x-2 transition-all duration-300">
            <AnimatePresence>
              {game.playerHand.map((card) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  isPlayable={isCardPlayable(card)}
                  onClick={() => playCard(card, 'player')}
                  onPeek={showCardInfo}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <span className={`text-2xl ${SUIT_COLORS[toast.suit]}`}>
              {SUIT_SYMBOLS[toast.suit]}
            </span>
            <span className="text-sm font-bold tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suit Selector Overlay */}
      <AnimatePresence>
        {game.isSuitSelecting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-center mb-2">Wild Card!</h2>
              <p className="text-slate-400 text-center mb-8">Select the new suit to continue</p>
              
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelect(suit)}
                    className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all group"
                  >
                    <span className={`text-4xl ${SUIT_COLORS[suit]} group-hover:scale-125 transition-transform`}>
                      {SUIT_SYMBOLS[suit]}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">
                      {suit}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {game.status === 'gameOver' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 p-12 rounded-[2.5rem] max-w-lg w-full shadow-2xl text-center"
            >
              <div className={`w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center ${
                game.winner === 'player' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'
              } shadow-2xl`}>
                <Trophy className="text-white w-12 h-12" />
              </div>
              
              <h2 className="text-4xl font-black mb-4 tracking-tight">
                {game.winner === 'player' ? 'Victory!' : 'Defeat!'}
              </h2>
              <p className="text-slate-400 text-lg mb-10">
                {game.winner === 'player' 
                  ? 'You cleared your hand and won the game!' 
                  : 'The AI was faster this time. Better luck next round!'}
              </p>
              
              <button
                onClick={() => setGame(prev => ({ ...prev, status: 'waiting' }))}
                className="w-full py-5 bg-white text-black font-bold rounded-2xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-3 text-lg"
              >
                <RotateCcw className="w-6 h-6" />
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="p-4 text-center text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">
        Standard 52 Card Deck • Wild 8s Rule • AI Opponent v1.0
      </footer>
    </div>
  );
}
