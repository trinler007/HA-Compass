import json, math, jinja2, yaml, base64, sys
from datetime import datetime
import os; D=os.path.dirname(os.path.abspath(__file__))+'/'
img64=base64.b64encode(open(D+'nx01.png','rb').read()).decode()
def render(mode):
    states={'sensor.camper_kompass_ausrichtung_geografisch':'324','select.ha_compass_ansicht':mode,
     'sensor.ha_compass_sonne_azimut':'251','sensor.ha_compass_sonne_hoehe':'4','sensor.ha_compass_mond_azimut':'72',
     'sensor.ha_compass_mond_hoehe':'12','sensor.ha_compass_mond_beleuchtung':'34','sensor.ha_compass_schattenseite':'links',
     'sensor.ha_compass_sonne_relativ':'79','sensor.ha_compass_sonnenaufgang':'2026-10-19T05:42:00+00:00','sensor.ha_compass_sonnenuntergang':'2026-10-19T16:58:00+00:00'}
    attrs={('sensor.ha_compass_sonnenaufgang','azimut'):104,('sensor.ha_compass_sonnenuntergang','azimut'):256}
    env=jinja2.Environment()
    def flt(v,d=0):
        try: return float(v)
        except: return d
    env.filters['float']=flt; env.filters['int']=lambda v,d=0:int(float(v))
    env.filters['timestamp_custom']=lambda ts,f: datetime.fromtimestamp(ts).strftime(f)
    g=dict(states=lambda e:states.get(e,'unknown'),is_state=lambda e,v:states.get(e)==v,state_attr=lambda e,a:attrs.get((e,a)),
     sin=math.sin,cos=math.cos,pi=math.pi,has_value=lambda e:e in states,as_timestamp=lambda s,d=0:datetime.fromisoformat(s).timestamp())
    objs={}
    for l in open(D+'page.jsonl',encoding='utf-8'):
        if l.startswith('{'):
            o=json.loads(l); objs[o['id']]=o
    cfg=yaml.safe_load(open(D+'openhasp-ha-compass.yaml',encoding='utf-8'))
    for o in cfg['openhasp']['terminal01']['objects']:
        i=int(o['obj'].split('b')[1])
        for k,v in o.get('properties',{}).items():
            r=env.from_string(v).render(**g); objs[i][k]=int(r) if r.lstrip('-').isdigit() else r
    out=['<div style="position:relative;width:480px;height:480px;background:#2C3E50;overflow:hidden;font-family:Helvetica,Arial,sans-serif">',
         '<div style="position:absolute;left:0;top:0;width:480px;height:52px;background:#22313f;color:#fff;font-size:18px;padding:14px 10px;box-sizing:border-box">Mo 19.10.2026 <span style="float:right">09:46</span></div>',
         '<div style="position:absolute;left:0;top:420px;width:480px;height:60px;background:#22313f;color:#fff;font-size:30px;text-align:center;line-height:60px">◀ &nbsp; ⌂ &nbsp; ▶</div>']
    for i,o in objs.items():
        if i in (0,1) or o.get('hidden')==1: continue
        x,y,w,h=o.get('x',0),o.get('y',0),o.get('w',0),o.get('h',0)
        t=o.get('obj')
        if t=='obj':
            out.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:{o.get("radius",0)}px;background:{o["bg_color"]};border:{o.get("border_width",0)}px solid {o.get("border_color","none")};box-sizing:border-box"></div>')
        elif t=='linemeter':
            cx,cy,r=x+w/2,y+h/2,w/2; n=o.get('line_count',31)-1; L=o.get('scale_width',8); rotd=o.get('rotation',0) or 0; s2=''
            for k in range(n):
                a=math.radians(k*360/n+90+rotd); s2+=f'<line x1="{cx+r*math.cos(a)}" y1="{cy+r*math.sin(a)}" x2="{cx+(r-L)*math.cos(a)}" y2="{cy+(r-L)*math.sin(a)}" stroke="{o.get("line_color","#B7C9D8")}" stroke-width="{o.get("line_width",2)}"/>'
            out.append(f'<svg style="position:absolute;left:0;top:0" width="480" height="480">{s2}</svg>')
        elif t=='arc':
            cx,cy,r=x+w/2,y+h/2,w/2-3
            def arc(a0,a1,op):
                p0=(cx+r*math.cos(math.radians(a0)),cy+r*math.sin(math.radians(a0))); p1=(cx+r*math.cos(math.radians(a1)),cy+r*math.sin(math.radians(a1)))
                large=1 if (a1-a0)%360>180 else 0
                return f'<path d="M{p0[0]} {p0[1]}A{r} {r} 0 {large} 1 {p1[0]} {p1[1]}" stroke="#F59E0B" stroke-opacity="{op}" stroke-width="6" fill="none" stroke-linecap="round"/>'
            out.append(f'<svg style="position:absolute;left:0;top:0" width="480" height="480">{arc(o["start_angle"],o["end_angle"],0.35)}{arc(o["start_angle10"],o["end_angle10"],1)}</svg>')
        elif t=='img' and 'nx01' in o['src']:
            out.append(f'<img src="data:image/png;base64,{img64}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;transform:rotate({o.get("angle",0)/10}deg) scale({o.get("zoom",256)/256})">')
        elif t in ('label','btn'):
            font=o.get('text_font',20); fs=int(str(font).replace('mdi','')); txt=o.get('text','')
            if 'mdi' in str(font): txt={'\U000f0599':'☀','\U000f059c':'↑','\U000f059b':'↓','\U000f0594':'☾'}.get(txt,'?')
            bg=f'background:{o["bg_color"]};border-radius:10px;' if t=='btn' else ''
            al={0:'left',1:'center',2:'right'}[o.get('align',1 if t=='btn' else 0)]
            out.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{bg}color:{o.get("text_color","#fff")};font-size:{fs*0.8:.0f}px;text-align:{al};line-height:{h}px;white-space:nowrap">{txt}</div>')
    out.append('</div>')
    return ''.join(out)
html='<html><body style="margin:0;background:#888;display:flex;gap:20px;padding:20px">'+render('fahrzeug_dreht')+render('ring_dreht')+'</body></html>'
open(D+'vorschau.html','w',encoding='utf-8').write(html)
