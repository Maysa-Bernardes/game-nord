'use client'
import { useGameManager, HERO_MAX_DEFENSE } from "@/app/hooks/gameManager";
import "./style.css"

const BASEPATH = '/game-nord';

export default function Home() {
  const {
    hero,
    villain,
    gameState,
    isHeroTurn,
    handleHeroAction,
    resetGame,
    disabledActions,
    timeLeft,
    villainLastAction,
    heroDefenseCount,
  } = useGameManager();

  return (
    <div className="game-container">      
    {gameState !== 'playing' && (
        <div className="top-reset-button">
          <button className="reset-button-top" onClick={resetGame}>Novo Jogo</button>
          <div className="winner-message">
            {gameState === 'heroWins' && <p>🎉 RAGNAR VENCEU! 🎉</p>}
            {gameState === 'villainWins' && <p>💀 BJORN VENCEU! 💀</p>}
          </div>
        </div>
      )}
      
      <div className="game-board">
        <div className="character-section hero-section">
          <div className="character-header">
            <h1 className="character-name">RAGNAR</h1>
            <div className="life-bar">
              <div className="life-fill" style={{
                width: Math.max(0, hero.life) + "%",
              }}></div>
              <span className="life-text">{hero.life}</span>
            </div>
            <div className="character-status">
              {isHeroTurn && villain.incomingAttack && gameState === 'playing' && (
                <span className="status-defending">RECEBENDO ATAQUE, DEFENDER {timeLeft}S</span>
              )}
              {isHeroTurn && !villain.incomingAttack && gameState === 'playing' && (
                <span className="status-attacking">ATACANDO</span>
              )}
              {!isHeroTurn && gameState === 'playing' && (
                <span className="status-waiting">AGUARDANDO</span>
              )}
              {gameState !== 'playing' && (
                <span className="status-ended">JOGO ENCERRADO</span>
              )}
            </div>
          </div>
          <div className="character-image">
            <img src={`${BASEPATH}/heroi.svg`} alt="RAGNAR" />
          </div>
        </div>

        <div className="character-section villain-section">
          <div className="character-header">
            <h1 className="character-name">BJORN</h1>
            <div className="life-bar">
              <div className="life-fill" style={{
                width: Math.max(0, villain.life) + "%",
              }}></div>
              <span className="life-text">{villain.life}</span>
            </div>
            <div className="character-status">
              {!isHeroTurn && gameState === 'playing' && (
                <span className="status-attacking">ATACANDO</span>
              )}
              {isHeroTurn && gameState === 'playing' && (
                <span className="status-waiting">AGUARDANDO</span>
              )}
              {gameState !== 'playing' && (
                <span className="status-ended">JOGO ENCERRADO</span>
              )}
            </div>
          </div>
          <div className="character-image">
            <img src={`${BASEPATH}/vilao.svg`} alt="BJORN" />
          </div>
          <div className="villain-action">
            {villainLastAction && (
              <span className="villain-action-text">{villainLastAction}</span>
            )}
          </div>
        </div>
      </div>
      {villain.incomingAttack && gameState === 'playing' && (
        <div className="status-message">VILÃO ESTÁ ATACANDO</div>
      )}
      {gameState === 'playing' && isHeroTurn && (
        <div className="actions-container">
          <button 
            className="action-button attack-button"
            disabled={disabledActions.includes('attack') || hero.life <= 0}
            onClick={() => handleHeroAction("attack")}
          >
            ATACAR
          </button>
          <button 
            className="action-button defend-button"
            disabled={hero.life <= 0 || heroDefenseCount >= HERO_MAX_DEFENSE}
            onClick={() => handleHeroAction("defense")}
          >
            DEFENDER
          </button>
          <button 
            className="action-button potion-button"
            disabled={disabledActions.includes('usePotion') || hero.life <= 0}
            onClick={() => handleHeroAction("usePotion")}
          >
            POÇÃO
          </button>
          <button 
            className="action-button flee-button"
            disabled={disabledActions.includes('flee') || hero.life <= 0}
            onClick={() => handleHeroAction("flee")}
          >
            CORRER
          </button>
        </div>
      )}
    </div>
  );
}
