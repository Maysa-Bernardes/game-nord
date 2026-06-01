'use client'
import { useState, useCallback, useEffect, useRef } from 'react';

const INITIAL_LIFE = 100;
const ATTACK_DAMAGE = 20;
const POTION_HEAL = 30;
const MAX_POTIONS = 3;
const VILLAIN_DEFEND_CHANCE = 0.15; 

export const useGameManager = () => {
  const [hero, setHero] = useState({
    name: 'Roxas',
    life: INITIAL_LIFE,
    potions: MAX_POTIONS,
    incomingAttack: false,
  });

  const [villain, setVillain] = useState({
    name: 'Sephiroth',
    life: INITIAL_LIFE,
    potions: MAX_POTIONS,
    incomingAttack: false,
  });

  const [gameState, setGameState] = useState('playing'); 
  const [isHeroTurn, setIsHeroTurn] = useState(true);
  const [gameLog, setGameLog] = useState(['Jogo iniciado!']);
  const [villainLastAction, setVillainLastAction] = useState(null);
  const [disabledActions, setDisabledActions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(5);
  const [heroDefenseCount, setHeroDefenseCount] = useState(0);
  const [villainDefenseCount, setVillainDefenseCount] = useState(0);
  const [villainLastWasDefense, setVillainLastWasDefense] = useState(false);
  
  const defenseTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  
  const gameStateRef = useRef({
    hero,
    villain,
    isHeroTurn,
    gameState,
    villainDefenseCount,
    villainLastWasDefense,
  });

  
  useEffect(() => {
    gameStateRef.current = { hero, villain, isHeroTurn, gameState, villainDefenseCount, villainLastWasDefense };
  }, [hero, villain, isHeroTurn, gameState, villainDefenseCount, villainLastWasDefense]);

  
  const addLog = useCallback((message) => {
    setGameLog(prev => [...prev, message]);
  }, []);

  
  const checkWinner = useCallback((heroLife, villainLife) => {
    if (heroLife <= 0) {
      setGameState('villainWins');
      addLog('💀 Vilão venceu! Herói foi derrotado!');
      return true;
    }
    if (villainLife <= 0) {
      setGameState('heroWins');
      addLog('🎉 Herói venceu! Vilão foi derrotado!');
      return true;
    }
    return false;
  }, [addLog]);

  
  const handleHeroAction = useCallback((action) => {
    if (!gameStateRef.current.isHeroTurn || gameStateRef.current.gameState !== 'playing') return;

    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (defenseTimerRef.current) {
      clearTimeout(defenseTimerRef.current);
      defenseTimerRef.current = null;
    }
    setTimeLeft(5);

    let newHeroLife = gameStateRef.current.hero.life;
    let newVillainLife = gameStateRef.current.villain.life;
    let newHeroPotions = gameStateRef.current.hero.potions;
    let newVillainIncomingAttack = gameStateRef.current.villain.incomingAttack;
    let newHeroIncomingAttack = gameStateRef.current.hero.incomingAttack;

    
    if (gameStateRef.current.villain.incomingAttack) {
      if (action === 'defense') {
        addLog(`⚔️ ${gameStateRef.current.hero.name} se defendeu! Bloqueou o ataque!`);
        newVillainIncomingAttack = false;
        setHeroDefenseCount(prev => prev + 1);
        
        
        setHero(prev => ({
          ...prev,
          life: newHeroLife,
          potions: newHeroPotions,
          incomingAttack: newHeroIncomingAttack,
        }));

        setVillain(prev => ({
          ...prev,
          life: newVillainLife,
          incomingAttack: newVillainIncomingAttack,
        }));

        setIsHeroTurn(false);
        return;
      } else if (action === 'flee') {
        addLog(`🏃 ${gameStateRef.current.hero.name} correu e perdeu o jogo!`);
        
        setHero(prev => ({
          ...prev,
          life: newHeroLife,
          potions: newHeroPotions,
          incomingAttack: newHeroIncomingAttack,
        }));

        setVillain(prev => ({
          ...prev,
          life: newVillainLife,
          incomingAttack: newVillainIncomingAttack,
        }));

        setGameState('villainWins');
        setIsHeroTurn(false);
        return;
      } else {
        
        newHeroLife -= ATTACK_DAMAGE;
        addLog(`💥 ${gameStateRef.current.hero.name} sofreu ${ATTACK_DAMAGE} de dano! (vida: ${Math.max(0, newHeroLife)})`);
        newVillainIncomingAttack = false;

        if (checkWinner(newHeroLife, newVillainLife)) {
          setHero(prev => ({
            ...prev,
            life: newHeroLife,
            potions: newHeroPotions,
            incomingAttack: newHeroIncomingAttack,
          }));

          setVillain(prev => ({
            ...prev,
            life: newVillainLife,
            incomingAttack: newVillainIncomingAttack,
          }));

          setIsHeroTurn(false);
          return;
        }

        
        if (action === 'attack') {
          newVillainIncomingAttack = true;
          addLog(`⚔️ ${gameStateRef.current.hero.name} atacou o ${gameStateRef.current.villain.name}!`);
        } else if (action === 'usePotion') {
          if (newHeroPotions > 0) {
            newHeroLife = Math.min(INITIAL_LIFE, newHeroLife + POTION_HEAL);
            newHeroPotions--;
            addLog(`💊 ${gameStateRef.current.hero.name} usou uma poção! Recuperou ${POTION_HEAL} de vida. (Poções restantes: ${newHeroPotions})`);
          } else {
            addLog(`❌ ${gameStateRef.current.hero.name} não tem mais poções!`);
          }
        }
      }
    } else {
      
      if (action === 'attack') {
        newHeroIncomingAttack = true;
        addLog(`⚔️ ${gameStateRef.current.hero.name} está preparando um ataque!`);
      } else if (action === 'defense') {
        addLog(`🛡️ ${gameStateRef.current.hero.name} ficou em guarda!`);
        setHeroDefenseCount(prev => prev + 1);
      } else if (action === 'usePotion') {
        if (newHeroPotions > 0) {
          newHeroLife = Math.min(INITIAL_LIFE, newHeroLife + POTION_HEAL);
          newHeroPotions--;
          addLog(`💊 ${gameStateRef.current.hero.name} usou uma poção! Recuperou ${POTION_HEAL} de vida. (Poções restantes: ${newHeroPotions})`);
        } else {
          addLog(`❌ ${gameStateRef.current.hero.name} não tem mais poções!`);
        }
      } else if (action === 'flee') {
        addLog(`🏃 ${gameStateRef.current.hero.name} correu e perdeu o jogo!`);
        
        setHero(prev => ({
          ...prev,
          life: newHeroLife,
          potions: newHeroPotions,
          incomingAttack: newHeroIncomingAttack,
        }));

        setVillain(prev => ({
          ...prev,
          life: newVillainLife,
          incomingAttack: newVillainIncomingAttack,
        }));

        setGameState('villainWins');
        setIsHeroTurn(false);
        return;
      }
    }

    setHero(prev => ({
      ...prev,
      life: newHeroLife,
      potions: newHeroPotions,
      incomingAttack: newHeroIncomingAttack,
    }));

    setVillain(prev => ({
      ...prev,
      life: newVillainLife,
      incomingAttack: newVillainIncomingAttack,
    }));

    setIsHeroTurn(false);
  }, [addLog, checkWinner]);

  const villainTurn = useCallback((currentHero, currentVillain) => {
    let newHeroLife = currentHero.life;
    let newVillainLife = currentVillain.life;
    let newVillainPotions = currentVillain.potions;
    let newHeroIncomingAttack = currentHero.incomingAttack;
    let newVillainIncomingAttack = currentVillain.incomingAttack;
    
    if (currentHero.incomingAttack) {
      const canDefend = gameStateRef.current.villainDefenseCount < 3 && !gameStateRef.current.villainLastWasDefense;
      const willDefend = canDefend && Math.random() < VILLAIN_DEFEND_CHANCE;
      
      if (willDefend) {
        addLog(`🛡️ ${currentVillain.name} se defendeu! Bloqueou o ataque!`);
        setVillainLastAction('Defendeu');
        setVillainDefenseCount(prev => prev + 1);
        setVillainLastWasDefense(true);
        newHeroIncomingAttack = false;
        
        setHero(prev => ({
          ...prev,
          life: newHeroLife,
          incomingAttack: newHeroIncomingAttack,
        }));

        setVillain(prev => ({
          ...prev,
          life: newVillainLife,
          potions: newVillainPotions,
          incomingAttack: newVillainIncomingAttack,
        }));

        setIsHeroTurn(true);
        return;
      } else {
        
        newVillainLife -= ATTACK_DAMAGE;
        addLog(`💥 ${currentVillain.name} sofreu ${ATTACK_DAMAGE} de dano! (vida: ${Math.max(0, newVillainLife)})`);
        setVillainLastAction('Levou dano');
        setVillainLastWasDefense(false);
        newHeroIncomingAttack = false;

        if (checkWinner(newHeroLife, newVillainLife)) {
          setHero(prev => ({
            ...prev,
            life: newHeroLife,
            incomingAttack: newHeroIncomingAttack,
          }));

          setVillain(prev => ({
            ...prev,
            life: newVillainLife,
            potions: newVillainPotions,
            incomingAttack: newVillainIncomingAttack,
          }));

          setIsHeroTurn(true);
          return;
        }
        
        let action;
        
        if (newVillainLife <= 10) {
          const rand = Math.random();
          if (rand < 0.15) {
            action = 'flee';
          } else if (rand < 0.85 && newVillainPotions > 0) {
            action = 'usePotion';
          } else {
            action = 'attack';
          }
        } else {
          
          action = newVillainPotions > 0 ? (Math.random() < 0.6 ? 'attack' : 'usePotion') : 'attack';
        }

        if (action === 'attack') {
          newVillainIncomingAttack = true;
          addLog(`⚔️ ${currentVillain.name} está preparando um ataque!`);
          setVillainLastAction('Está atacando');
        } else if (action === 'usePotion') {
          if (newVillainPotions > 0) {
            newVillainLife = Math.min(INITIAL_LIFE, newVillainLife + POTION_HEAL);
            newVillainPotions--;
            addLog(`💊 ${currentVillain.name} usou uma poção! Recuperou ${POTION_HEAL} de vida. (Poções restantes: ${newVillainPotions})`);
            setVillainLastAction('Usou poção');
          }
        } else if (action === 'flee') {
          addLog(`🏃 ${currentVillain.name} correu e perdeu o jogo!`);
          setVillainLastAction('Correu');
          
          setHero(prev => ({
            ...prev,
            life: newHeroLife,
            incomingAttack: newHeroIncomingAttack,
          }));

          setVillain(prev => ({
            ...prev,
            life: newVillainLife,
            potions: newVillainPotions,
            incomingAttack: newVillainIncomingAttack,
          }));

          setGameState('heroWins');
          setIsHeroTurn(true);
          return;
        }
      }
    } else {
      
      let action;
      
      if (currentVillain.life <= 10) {
        
        const rand = Math.random();
        if (rand < 0.15) {
          action = 'flee';
        } else if (rand < 0.85 && currentVillain.potions > 0) {
          action = 'usePotion';
        } else {
          action = 'attack';
        }
      } else if (currentVillain.life > 60) {
        
        action = 'attack';
      } else {
        
        if (currentVillain.potions > 0) {
          action = Math.random() < 0.6 ? 'attack' : 'usePotion';
        } else {
          action = 'attack';
        }
      }

      if (action === 'attack') {
        newVillainIncomingAttack = true;
        addLog(`⚔️ ${currentVillain.name} está preparando um ataque!`);
        setVillainLastAction('Está atacando');
        setVillainLastWasDefense(false);
      } else if (action === 'usePotion') {
        if (newVillainPotions > 0) {
          newVillainLife = Math.min(INITIAL_LIFE, newVillainLife + POTION_HEAL);
          newVillainPotions--;
          addLog(`💊 ${currentVillain.name} usou uma poção! Recuperou ${POTION_HEAL} de vida. (Poções restantes: ${newVillainPotions})`);
          setVillainLastAction('Usou poção');
          setVillainLastWasDefense(false);
        } else {
          
          newVillainIncomingAttack = true;
          addLog(`⚔️ ${currentVillain.name} está preparando um ataque!`);
          setVillainLastAction('Está atacando');
          setVillainLastWasDefense(false);
        }
      } else if (action === 'flee') {
        addLog(`🏃 ${currentVillain.name} correu e perdeu o jogo!`);
        setVillainLastAction('Correu');
        setVillainLastWasDefense(false);
        
        setHero(prev => ({
          ...prev,
          life: newHeroLife,
          incomingAttack: newHeroIncomingAttack,
        }));

        setVillain(prev => ({
          ...prev,
          life: newVillainLife,
          potions: newVillainPotions,
          incomingAttack: newVillainIncomingAttack,
        }));

        setGameState('heroWins');
        setIsHeroTurn(true);
        return;
      }
    }

    setHero(prev => ({
      ...prev,
      life: newHeroLife,
      incomingAttack: newHeroIncomingAttack,
    }));

    setVillain(prev => ({
      ...prev,
      life: newVillainLife,
      potions: newVillainPotions,
      incomingAttack: newVillainIncomingAttack,
    }));

    setIsHeroTurn(true);
  }, [addLog, checkWinner]);

  useEffect(() => {
    if (!isHeroTurn && gameState === 'playing') {
      const timer = setTimeout(() => {
        villainTurn(hero, villain);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isHeroTurn, gameState, hero, villain, villainTurn]);

  useEffect(() => {
    if (isHeroTurn && villain.incomingAttack && gameState === 'playing') {
      setTimeLeft(5);
      
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      };
    }
  }, [isHeroTurn, villain.incomingAttack, gameState]);
  
  useEffect(() => {
    if (timeLeft === 0 && gameStateRef.current.isHeroTurn && gameStateRef.current.villain.incomingAttack && gameStateRef.current.gameState === 'playing') {
      
      setHero(prev => {
        const newLife = Math.max(0, prev.life - ATTACK_DAMAGE);
        addLog(`💥 ${prev.name} sofreu ${ATTACK_DAMAGE} de dano por não defender! (vida: ${newLife})`);
        
        if (newLife <= 0) {
          setGameState('villainWins');
          addLog('💀 Vilão venceu! Herói foi derrotado!');
          setIsHeroTurn(false);
        }
        
        return {
          ...prev,
          life: newLife,
          incomingAttack: false,
        };
      });
      
      setVillain(prev => ({
        ...prev,
        incomingAttack: false,
      }));
      
      setTimeLeft(5);
    }
  }, [timeLeft]);

  
  useEffect(() => {
    const disabled = [];
    
    if (villain.incomingAttack) {
      disabled.push('attack');
      disabled.push('usePotion');
    }

    if (hero.potions === 0) {
      disabled.push('usePotion');
    }

    setDisabledActions(disabled);
  }, [villain.incomingAttack, hero.potions]);

  
  const resetGame = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (defenseTimerRef.current) {
      clearTimeout(defenseTimerRef.current);
      defenseTimerRef.current = null;
    }
    setHero({
      name: 'Roxas',
      life: INITIAL_LIFE,
      potions: MAX_POTIONS,
      incomingAttack: false,
    });
    setVillain({
      name: 'Sephiroth',
      life: INITIAL_LIFE,
      potions: MAX_POTIONS,
      incomingAttack: false,
    });
    setGameState('playing');
    setIsHeroTurn(true);
    setGameLog(['Jogo reiniciado!']);
    setVillainLastAction(null);
    setDisabledActions([]);
    setTimeLeft(5);
    setHeroDefenseCount(0);
    setVillainDefenseCount(0);
    setVillainLastWasDefense(false);
  }, []);

  return {
    hero,
    villain,
    gameState,
    isHeroTurn,
    gameLog,
    handleHeroAction,
    resetGame,
    disabledActions,
    timeLeft,
    villainLastAction,
    heroDefenseCount,
    villainDefenseCount,
    villainLastWasDefense,
  };
};
