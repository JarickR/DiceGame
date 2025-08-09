export default function UpgradeChooser({choice, onKeepNew, onKeepOld}){
  if(!choice) return null;
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Upgrade</h2>
        <p className="small muted">Replace the selected face with a random face of the next tier (or keep the old one).</p>
        <div className="row" style={{gap:12}}>
          <div className="card" style={{flex:1}}>
            <div className="bold">Old</div>
            <div className="small">{choice.oldFace.name} (T{choice.oldFace.tier||0})</div>
          </div>
          <div className="card" style={{flex:1}}>
            <div className="bold">New</div>
            <div className="small">{choice.newFace.name} (T{choice.newFace.tier||0})</div>
          </div>
        </div>
        <div className="bar" style={{marginTop:12}}>
          <button className="btn" onClick={onKeepNew}>Take New</button>
          <button className="btn secondary" onClick={onKeepOld}>Keep Old</button>
        </div>
      </div>
    </div>
  );
}
const overlayStyle = { position:'fixed', inset:0, backdropFilter:'blur(4px)', background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 };
const modalStyle   = { background:'#12151a', border:'1px solid #242a34', borderRadius:12, padding:16, width:520 };
