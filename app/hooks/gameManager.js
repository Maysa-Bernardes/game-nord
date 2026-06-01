'use client'
import { useState, useCallback, useEffect, useRef } from 'react';

const INITIAL_LIFE = 100;
const ATTACK_DAMAGE = 20;
const POTION_HEAL = 30;
const MAX_POTIONS = 3;
const VILLAIN_DEFEND_CHANCE = 0.15; // 15% de chance de defender

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

  const [gameState, setGameState] = useState('playing'); // playing, heroWins, villainWins
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

  // Consolidar refs em um único objeto para simplificar o gerenciamento
  const gameStateRef = useRef({
    hero,
    villain,
    isHeroTurn,
    gameState,
    villainDefenseCount,
    villainLastWasDefense,
  });

  // Atualiza o ref consolidado quando os estados mudam
  useEffect(() => {
    gameStateRef.current = { hero, villain, isHeroTurn, gameState, villainDefenseCount, villainLastWasDefense };
  }, [hero, villain, isHeroTurn, gameState, villainDefenseCount, villainLastWasDefense]);

  // Adiciona mensagem ao log
  const addLog = useCallback((message) => {
    setGameLog(prev => [...prev, message]);
  }, []);

  // Verifica se há um vencedor
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

  // Processa a ação do herói
  const handleHeroAction = useCallback((action) => {
    if (!gameStateRef.current.isHeroTurn || gameStateRef.current.gameState !== 'playing') return;

    // Limpa o timer de defesa se existir
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

    // Se há ataque do vilão vindo, herói precisa defender ou sofrer dano
    if (gameStateRef.current.villain.incomingAttack) {
      if (action === 'defense') {
        addLog(`⚔️ ${gameStateRef.current.hero.name} se defendeu! Bloqueou o ataque!`);
        newVillainIncomingAttack = false;
        setHeroDefenseCount(prev => prev + 1);
        
        // Atualiza estados e passa a vez imediatamente
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
        // Sofre dano e executa a ação
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

        // Executa a ação após sofrer dano
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
      // Não há ataque vindo
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

  // Vilão escolhe uma ação aleatória
  const villainTurn = useCallback((currentHero, currentVillain) => {
    let newHeroLife = currentHero.life;
    let newVillainLife = currentVillain.life;
    let newVillainPotions = currentVillain.potions;
    let newHeroIncomingAttack = currentHero.incomingAttack;
    let newVillainIncomingAttack = currentVillain.incomingAttack;

    // Se há ataque do herói vindo, vilão precisa DEFENDER ou SOFRER DANO
    if (currentHero.incomingAttack) {
      // Vilão tem 15% de chance de defender, mas só se:
      // 1. Tiver defesas restantes (< 3)
      // 2. NÃO defendeu na última ação
      const canDefend = gameStateRef.current.villainDefenseCount < 3 && !gameStateRef.current.villainLastWasDefense;
      const willDefend = canDefend && Math.random() < VILLAIN_DEFEND_CHANCE;
      
      if (willDefend) {
        addLog(`🛡️ ${currentVillain.name} se defendeu! Bloqueou o ataque!`);
        setVillainLastAction('Defendeu');
        setVillainDefenseCount(prev => prev + 1);
        setVillainLastWasDefense(true);
        newHeroIncomingAttack = false;

        // Atualiza estados e passa a vez imediatamente
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
        // Sofre dano primeiro
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

        // Depois de sofrer dano, vilão escolhe uma ação: atacar ou poção
        // SÓ pode FUGIR se vida <= 10
        let action;
        
        if (newVillainLife <= 10) {
          // Vida muito baixa: pode fugir (15%), poção (70%) ou ataque (15%)
          const rand = Math.random();
          if (rand < 0.15) {
            action = 'flee';
          } else if (rand < 0.85 && newVillainPotions > 0) {
            action = 'usePotion';
          } else {
            action = 'attack';
          }
        } else {
          // Vida > 10: SÓ pode atacar ou poção (sem fuga)
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
      // Não há ataque vindo - vilão sempre escolhe entre: ATACAR, POÇÃO
      // SÓ pode FUGIR se vida <= 10
      let action;
      
      if (currentVillain.life <= 10) {
        // Vida muito baixa: pode fugir (15%), poção (70%) ou ataque (15%)
        const rand = Math.random();
        if (rand < 0.15) {
          action = 'flee';
        } else if (rand < 0.85 && currentVillain.potions > 0) {
          action = 'usePotion';
        } else {
          action = 'attack';
        }
      } else if (currentVillain.life > 60) {
        // Se vida alta, prioriza ataque
        action = 'attack';
      } else {
        // Vida média: escolhe entre ataque ou poção (SEM fuga)
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
          // Se não tem poção, ataca
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

  // Executa turno do vilão após uma pequena pausa
  useEffect(() => {
    if (!isHeroTurn && gameState === 'playing') {
      const timer = setTimeout(() => {
        villainTurn(hero, villain);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isHeroTurn, gameState, hero, villain, villainTurn]);

  // Timer de defesa automática para o herói
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

  // Aplica dano automático quando o tempo acabar (sem executar ação)
  useEffect(() => {
    if (timeLeft === 0 && gameStateRef.current.isHeroTurn && gameStateRef.current.villain.incomingAttack && gameStateRef.current.gameState === 'playing') {
      // Aplica dano por não defender
      setHero(prev => {
        const newLife = Math.max(0, prev.life - ATTACK_DAMAGE);
        addLog(`💥 ${prev.name} sofreu ${ATTACK_DAMAGE} de dano por não defender! (vida: ${newLife})`);
        
        // Verifica se morreu
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

  // Atualiza ações desabilitadas baseado no estado
  useEffect(() => {
    const disabled = [];
    
    if (villain.incomingAttack) {
      // Se há ataque vindo, não pode atacar nem usar poção sem sofrer dano
      disabled.push('attack');
      disabled.push('usePotion');
    }

    if (hero.potions === 0) {
      disabled.push('usePotion');
    }

    setDisabledActions(disabled);
  }, [villain.incomingAttack, hero.potions]);

  // Reset do jogo
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
