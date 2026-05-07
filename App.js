import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, TextInput, Modal, Alert } from 'react-native';

const CYLINDER_G = 14200;
const FAMILY_DAYS = { 1:65, 2:48, 3:38, 4:32, 5:27, 6:23, 7:20, 8:17 };
const ACTIVITIES = [
  { id:'tea',       icon:'☕', label:'चाय / Tea',          g:15,  color:'#8B4513' },
  { id:'breakfast', icon:'🍳', label:'नाश्ता / Breakfast', g:55,  color:'#FF8C00' },
  { id:'lunch',     icon:'🍛', label:'दोपहर / Lunch',      g:130, color:'#228B22' },
  { id:'dinner',    icon:'🌙', label:'रात / Dinner',        g:160, color:'#4B0082' },
  { id:'extra',     icon:'🔥', label:'अतिरिक्त / Extra',   g:50,  color:'#DC143C' },
];

function GasGauge({ pct, daysLeft }) {
  const color = pct > 30 ? '#4CAF50' : pct > 15 ? '#FF9800' : '#F44336';
  return (
    <View style={{ alignItems:'center', marginVertical:20 }}>
      <View style={{ width:200, height:200, borderRadius:100, backgroundColor:'#FFF0E6', alignItems:'center', justifyContent:'center', borderWidth:3, borderColor:'#FFD9B3' }}>
        <View style={{ width:160, height:160, borderRadius:80, backgroundColor:'#FFF8F0', alignItems:'center', justifyContent:'center' }}>
          <Text style={{ fontSize:52, fontWeight:'900', color }}>{pct}%</Text>
          <Text style={{ fontSize:12, color:'#888', marginTop:2 }}>Gas Remaining</Text>
          <View style={{ backgroundColor:color+'22', borderRadius:20, paddingHorizontal:12, paddingVertical:4, marginTop:6, borderWidth:1, borderColor:color }}>
            <Text style={{ fontSize:13, color, fontWeight:'700' }}>{daysLeft} दिन / days</Text>
          </View>
        </View>
      </View>
      <View style={{ width:'80%', height:16, backgroundColor:'#F0E0D0', borderRadius:8, marginTop:16, overflow:'hidden' }}>
        <View style={{ width:pct+'%', height:'100%', backgroundColor:color, borderRadius:8 }} />
      </View>
    </View>
  );
}

export default function App() {
  const [screen, setScreen]         = useState('onboard');
  const [familySize, setFamily]     = useState(4);
  const [lang, setLang]             = useState('hi');
  const [cylinder, setCylinder]     = useState(null);
  const [todayLog, setTodayLog]     = useState([]);
  const [history, setHistory]       = useState([]);
  const [showType, setShowType]     = useState(false);
  const [typeText, setTypeText]     = useState('');

  const estDays = FAMILY_DAYS[Math.min(familySize, 8)] || 32;

  function calcGas() {
    if (!cylinder) return { pct:0, daysLeft:0 };
    const days = Math.max(0, Math.floor((Date.now() - new Date(cylinder.start)) / 86400000));
    const daily = CYLINDER_G / estDays;
    const logG  = todayLog.reduce((s,a) => s + (ACTIVITIES.find(x=>x.id===a)?.g||0), 0);
    const consumed = Math.max(0, (days-1)*daily + (todayLog.length>0 ? logG : daily));
    const pct = Math.max(0, Math.round(((CYLINDER_G-consumed)/CYLINDER_G)*100));
    const daysLeft = Math.max(0, Math.round((CYLINDER_G-consumed)/daily));
    return { pct, daysLeft };
  }

  function startCylinder() {
    setCylinder({ start: new Date().toISOString(), brand:'Indane' });
    setTodayLog([]);
    setScreen('home');
  }

  function finishCylinder() {
    Alert.alert('सिलेंडर खत्म? / Cylinder empty?', '', [
      { text:'Cancel', style:'cancel' },
      { text:'Yes', onPress:() => {
        setHistory(h => [{ ...cylinder, end: new Date().toISOString() }, ...h]);
        setCylinder(null); setTodayLog([]);
      }}
    ]);
  }

  function toggleActivity(id) {
    setTodayLog(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  }

  function submitType() {
    const lower = typeText.toLowerCase();
    const found = ACTIVITIES.filter(a => lower.includes(a.id) || lower.includes(a.label.split('/')[0].trim()) || lower.includes(a.label.split('/')[1].trim().toLowerCase()));
    if (found.length) setTodayLog(found.map(a=>a.id));
    setShowType(false); setTypeText('');
  }

  const { pct, daysLeft } = calcGas();
  const urgency = pct > 30 ? 'safe' : pct > 15 ? 'low' : 'critical';
  const urgencyMsg = { safe:'✅ Gas level is good', low:'⚠️ Gas running low — book soon', critical:'🚨 Gas almost empty! Book now' };
  const urgencyColor = { safe:'#E8F5E9', low:'#FFF3E0', critical:'#FFEBEE' };

  if (screen === 'onboard') return (
    <SafeAreaView style={[S.safe]}>
      <ScrollView contentContainerStyle={{ padding:24, alignItems:'center' }}>
        <Text style={{ fontSize:64, marginTop:24 }}>🪹</Text>
        <Text style={S.appName}>CylinderSathi</Text>
        <Text style={S.tagline}>आपका गैस साथी • Your Gas Companion</Text>
        <View style={S.card}>
          <Text style={S.cardTitle}>👨‍👩‍👧 घर में कितने लोग? / Family Size</Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10, justifyContent:'center', marginTop:12 }}>
            {[1,2,3,4,5,6,7,8].map(n => (
              <TouchableOpacity key={n} onPress={()=>setFamily(n)}
                style={[S.numChip, familySize===n && S.numChipOn]}>
                <Text style={[S.numText, familySize===n && {color:'#FF6B35',fontWeight:'800'}]}>{n}{n===8?'+':''}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ textAlign:'center', color:'#888', marginTop:12, fontSize:13 }}>
            Estimated cylinder life: ~{estDays} days
          </Text>
        </View>
        <TouchableOpacity style={S.primaryBtn} onPress={()=>setScreen('home')}>
          <Text style={S.primaryBtnText}>🚀 शुरू करें / Get Started</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  if (screen === 'home') return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={{ padding:20, alignItems:'center' }}>
        <View style={{ width:'100%', flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <View>
            <Text style={S.appName}>CylinderSathi</Text>
            <Text style={{ fontSize:12, color:'#888' }}>🇮🇳 आपका गैस साथी</Text>
          </View>
          <TouchableOpacity style={S.smallBtn} onPress={startCylinder}>
            <Text style={S.smallBtnText}>+ New Cylinder</Text>
          </TouchableOpacity>
        </View>

        {cylinder ? (
          <>
            <GasGauge pct={pct} daysLeft={daysLeft} />
            <View style={[S.card, { backgroundColor:urgencyColor[urgency], width:'100%' }]}>
              <Text style={{ fontWeight:'700', textAlign:'center', fontSize:15 }}>{urgencyMsg[urgency]}</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardTitle}>📅 सिलेंडर शुरू / Started</Text>
              <Text style={{ color:'#333', marginTop:4 }}>{new Date(cylinder.start).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</Text>
            </View>
            <View style={{ flexDirection:'row', gap:12, width:'100%', marginTop:4 }}>
              <TouchableOpacity style={[S.primaryBtn,{flex:1}]} onPress={()=>Alert.alert('📞 Book Cylinder','Indane: 8454955555\nHP Gas: 9222201122\nBharat: 7715012345')}>
                <Text style={S.primaryBtnText}>📞 Book Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.outlineBtn,{flex:1}]} onPress={finishCylinder}>
                <Text style={S.outlineBtnText}>Cylinder Empty</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={{ alignItems:'center', paddingVertical:40 }}>
            <Text style={{ fontSize:72 }}>🪹</Text>
            <Text style={{ fontSize:18, color:'#888', marginBottom:20, fontWeight:'600' }}>No active cylinder</Text>
            <TouchableOpacity style={S.primaryBtn} onPress={startCylinder}>
              <Text style={S.primaryBtnText}>+ Start New Cylinder</Text>
            </TouchableOpacity>
          </View>
        )}

        {cylinder && (
          <TouchableOpacity style={[S.card,{width:'100%',flexDirection:'row',alignItems:'center',gap:12,marginTop:12}]} onPress={()=>setScreen('log')}>
            <Text style={{fontSize:32}}>🍳</Text>
            <View style={{flex:1}}>
              <Text style={{fontSize:16,fontWeight:'700',color:'#333'}}>आज का खाना / Today's Log</Text>
              <Text style={{fontSize:13,color:'#999'}}>Tap to log your cooking</Text>
            </View>
            <Text style={{fontSize:28,color:'#FF6B35'}}>&rsaquo;</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <NavBar screen={screen} setScreen={setScreen} />
    </SafeAreaView>
  );

  if (screen === 'log') return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={{padding:20}}>
        <Text style={[S.appName,{fontSize:20}]}>🍳 आज का खाना / Today's Log</Text>
        <Text style={{color:'#888',marginBottom:16}}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</Text>

        <TouchableOpacity style={S.card} onPress={()=>setShowType(true)}>
          <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
            <Text style={{fontSize:28}}>🎤</Text>
            <View style={{flex:1}}>
              <Text style={{fontSize:15,fontWeight:'700',color:'#333'}}>Type what you cooked</Text>
              <Text style={{fontSize:12,color:'#999',fontStyle:'italic'}}>e.g. "tea breakfast lunch"</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Modal visible={showType} transparent animationType="slide">
          <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'flex-end'}}>
            <View style={{backgroundColor:'#FFF8F0',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingBottom:40}}>
              <Text style={{fontSize:18,fontWeight:'800',marginBottom:12}}>What did you cook today?</Text>
              <TextInput style={{backgroundColor:'#FFF',borderRadius:12,borderWidth:1,borderColor:'#FFD9B3',padding:14,fontSize:16,marginBottom:16}} placeholder="tea breakfast lunch dinner..." value={typeText} onChangeText={setTypeText} autoFocus />
              <View style={{flexDirection:'row',gap:12}}>
                <TouchableOpacity style={[S.outlineBtn,{flex:1}]} onPress={()=>setShowType(false)}><Text style={S.outlineBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[S.primaryBtn,{flex:1}]} onPress={submitType}><Text style={S.primaryBtnText}>OK ✓</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Text style={{fontSize:16,fontWeight:'700',color:'#333',marginVertical:12}}>Or tap what you cooked:</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>
          {ACTIVITIES.map(a => {
            const on = todayLog.includes(a.id);
            return (
              <TouchableOpacity key={a.id} onPress={()=>toggleActivity(a.id)}
                style={{width:'46%',backgroundColor:'#FFF',borderRadius:16,padding:14,alignItems:'center',borderWidth:2,borderColor:on?a.color:'#FFD9B3',backgroundColor:on?a.color+'18':'#FFF'}}>
                <Text style={{fontSize:32,marginBottom:4}}>{a.icon}</Text>
                <Text style={{fontSize:14,fontWeight:on?'700':'500',color:on?a.color:'#555'}}>{a.label.split('/')[0].trim()}</Text>
                <Text style={{fontSize:11,color:'#BBB',marginTop:2}}>~{a.g}g LPG</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {todayLog.length > 0 && (
          <View style={{backgroundColor:'#FFF0E6',borderRadius:14,padding:16,marginTop:16,alignItems:'center'}}>
            <Text style={{color:'#888',fontSize:13}}>Today's estimated usage</Text>
            <Text style={{fontSize:28,fontWeight:'800',color:'#FF6B35'}}>{todayLog.reduce((s,a)=>s+(ACTIVITIES.find(x=>x.id===a)?.g||0),0)}g LPG</Text>
          </View>
        )}
      </ScrollView>
      <NavBar screen={screen} setScreen={setScreen} />
    </SafeAreaView>
  );

  if (screen === 'history') return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={{padding:20}}>
        <Text style={[S.appName,{fontSize:22,marginBottom:16}]}>📋 इतिहास / History</Text>
        {cylinder && (
          <View style={S.card}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
              <Text style={{fontSize:15,fontWeight:'700',color:'#333'}}>Current Cylinder</Text>
              <View style={{backgroundColor:'#FF6B35',borderRadius:8,paddingHorizontal:8,paddingVertical:2}}><Text style={{color:'#FFF',fontSize:11,fontWeight:'700'}}>Active</Text></View>
            </View>
            <Text style={{color:'#888',marginTop:4}}>📅 Started: {new Date(cylinder.start).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</Text>
            <Text style={{color:'#4CAF50',fontWeight:'600',marginTop:4}}>⏱ {Math.floor((Date.now()-new Date(cylinder.start))/86400000)} days running</Text>
          </View>
        )}
        {history.length === 0 && !cylinder && (
          <View style={{alignItems:'center',paddingVertical:60}}>
            <Text style={{fontSize:56}}>📋</Text>
            <Text style={{fontSize:16,color:'#888',textAlign:'center',marginTop:12}}>No history yet.\nStart your first cylinder!</Text>
          </View>
        )}
        {history.map((c,i)=>{
          const days = Math.round((new Date(c.end)-new Date(c.start))/86400000);
          return (
            <View key={i} style={[S.card,{flexDirection:'row',gap:8,padding:14}]}>
              <View style={{width:4,backgroundColor:'#FF6B35',borderRadius:2}} />
              <View style={{flex:1}}>
                <Text style={{fontWeight:'700',fontSize:14,color:'#333'}}>Cylinder #{history.length-i}</Text>
                <Text style={{color:'#888',fontSize:13,marginTop:2}}>📅 {new Date(c.start).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} → {new Date(c.end).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</Text>
                <Text style={{color:days>=30?'#4CAF50':'#FF9800',fontWeight:'600',marginTop:2}}>⏱ {days} days</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <NavBar screen={screen} setScreen={setScreen} />
    </SafeAreaView>
  );

  if (screen === 'settings') return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={{padding:20}}>
        <Text style={[S.appName,{fontSize:22,marginBottom:16}]}>⚙️ Settings</Text>
        <View style={S.card}>
          <Text style={S.cardTitle}>👨‍👩‍👧 Family Size</Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10}}>
            {[1,2,3,4,5,6,7,8].map(n=>(
              <TouchableOpacity key={n} onPress={()=>setFamily(n)} style={[S.numChip,familySize===n&&S.numChipOn]}>
                <Text style={[S.numText,familySize===n&&{color:'#FF6B35',fontWeight:'800'}]}>{n}{n===8?'+':''}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{color:'#888',marginTop:10,fontSize:13}}>Estimated cylinder life: ~{estDays} days</Text>
        </View>
        <View style={S.card}>
          <Text style={S.cardTitle}>📞 Booking Numbers</Text>
          {[{n:'Indane',p:'8454955555'},{n:'HP Gas',p:'9222201122'},{n:'Bharat Gas',p:'7715012345'}].map(b=>(
            <View key={b.n} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,borderBottomWidth:1,borderColor:'#F0F0F0'}}>
              <Text style={{fontWeight:'600',color:'#333'}}>{b.n}</Text>
              <Text style={{color:'#FF6B35',fontWeight:'700'}}>{b.p}</Text>
            </View>
          ))}
        </View>
        <View style={[S.card,{alignItems:'center'}]}>
          <Text style={{fontSize:14,color:'#AAA'}}>CylinderSathi v1.0</Text>
          <Text style={{fontSize:13,color:'#AAA',marginTop:4}}>🇮🇳 Built for 300 million Indian homes</Text>
        </View>
      </ScrollView>
      <NavBar screen={screen} setScreen={setScreen} />
    </SafeAreaView>
  );
}

function NavBar({ screen, setScreen }) {
  const items = [
    { id:'home', icon:'🏠', label:'Home' },
    { id:'log',  icon:'🍳', label:'Log' },
    { id:'history', icon:'📋', label:'History' },
    { id:'settings', icon:'⚙️', label:'Settings' },
  ];
  return (
    <View style={{flexDirection:'row',backgroundColor:'#FFF8F0',borderTopWidth:1,borderTopColor:'#FFD9B3',paddingBottom:8,paddingTop:4}}>
      {items.map(item=>(
        <TouchableOpacity key={item.id} style={{flex:1,alignItems:'center',paddingVertical:6}} onPress={()=>setScreen(item.id)}>
          <Text style={{fontSize:screen===item.id?26:22,opacity:screen===item.id?1:0.5}}>{item.icon}</Text>
          <Text style={{fontSize:11,color:screen===item.id?'#FF6B35':'#999',fontWeight:screen===item.id?'700':'400',marginTop:2}}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const S = StyleSheet.create({
  safe:          { flex:1, backgroundColor:'#FFF8F0' },
  appName:       { fontSize:26, fontWeight:'800', color:'#FF6B35' },
  tagline:       { fontSize:13, color:'#888', marginTop:4, marginBottom:24 },
  card:          { backgroundColor:'#FFF', borderRadius:16, padding:16, marginBottom:12, borderWidth:1, borderColor:'#FFD9B3', width:'100%' },
  cardTitle:     { fontSize:15, fontWeight:'700', color:'#555' },
  primaryBtn:    { backgroundColor:'#FF6B35', borderRadius:14, padding:16, alignItems:'center', marginBottom:12 },
  primaryBtnText:{ color:'#FFF', fontSize:16, fontWeight:'700' },
  outlineBtn:    { backgroundColor:'#FFF', borderRadius:14, padding:16, alignItems:'center', borderWidth:1.5, borderColor:'#FFD9B3' },
  outlineBtnText:{ color:'#666', fontWeight:'600', fontSize:14 },
  smallBtn:      { backgroundColor:'#FF6B35', borderRadius:10, paddingHorizontal:14, paddingVertical:8 },
  smallBtnText:  { color:'#FFF', fontWeight:'700', fontSize:13 },
  numChip:       { width:44, height:44, borderRadius:22, borderWidth:1.5, borderColor:'#FFD9B3', alignItems:'center', justifyContent:'center' },
  numChipOn:     { borderColor:'#FF6B35', backgroundColor:'#FFF0E6' },
  numText:       { fontSize:16, color:'#666', fontWeight:'600' },
});
