export default function Character({ data, isHero, onAction, isHeroTurn, disabledActions = []}) {
    const lifePercent = Math.max(0,
        data.life) + "%"
    const isDefeated = data.life <= 0;
    
    const isAttackDisabled = disabledActions.includes('attack');
    const isPotionDisabled = disabledActions.includes('usePotion');
    const isFleeDisabled = disabledActions.includes('flee');
    
    return (
        <div className={`character ${isDefeated ? 'defeated' : ''}`}>
            <div className="life-bar">
                <div className="life-fill" style={{
                    width: lifePercent,
                }}></div>
                <span className="life-text">{data.life}</span>
            </div>
            <div className="sprite">Desenho Personagem</div>
            <h1>{data.name} - {isHero ? "Herói" : "Vilão"}</h1>
            <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                Poções: {data.potions}
            </div>
            {isHero && onAction && (
                <div className="actions">
                    <button disabled={!isHeroTurn || isDefeated || isAttackDisabled} onClick={
                        () => onAction("attack")
                    }>Atacar</button>
                    <button disabled={!isHeroTurn || isDefeated} onClick={
                        () => onAction("defense")
                    }>Defender</button>
                    <button disabled={!isHeroTurn || isDefeated || isPotionDisabled} onClick={
                        () => onAction("usePotion")
                    }>Poção</button>
                    <button disabled={!isHeroTurn || isDefeated || isFleeDisabled} onClick={
                        () => onAction("flee")
                    }>Correr</button>
                </div>
            )}
        </div>
    )
}