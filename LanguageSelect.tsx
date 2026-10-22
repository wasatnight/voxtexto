import {useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent} from "react";
import {createPortal} from "react-dom";
import {Check, ChevronDown} from "lucide-react";
import {languages} from "./lib/languages";

export default function LanguageSelect({value,disabled,onChange}:{value:string;disabled:boolean;onChange(value:string):void}) {
  const selected=Math.max(0,languages.findIndex(([code])=>code===value));
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState(selected);
  const [position,setPosition]=useState({left:0,top:0,width:0,maxHeight:300});
  const trigger=useRef<HTMLButtonElement>(null);
  const list=useRef<HTMLUListElement>(null);
  const search=useRef({text:"",time:0});
  const shown=open && !disabled;
  function choose(index:number) { onChange(languages[index][0]);setOpen(false);trigger.current?.focus(); }
  useLayoutEffect(()=>{
    if (!shown) return;
    function place() {
      const rect=trigger.current!.getBoundingClientRect();
      const below=innerHeight-rect.bottom-16;
      const above=rect.top-16;
      const down=below>=200 || below>=above;
      const height=Math.min(300,Math.max(80,down?below:above));
      setPosition({left:Math.max(8,Math.min(rect.left,innerWidth-rect.width-8)),top:down?rect.bottom+6:rect.top-6-height,width:rect.width,maxHeight:height});
    }
    place();
    const scroll=(event:Event)=>{ if (!list.current?.contains(event.target as Node)) place(); };
    window.addEventListener("resize",place);
    window.addEventListener("scroll",scroll,true);
    return ()=>{window.removeEventListener("resize",place);window.removeEventListener("scroll",scroll,true);};
  },[shown]);
  useEffect(()=>{
    if (!shown) return;
    const option=document.getElementById(`language-option-${active}`);
    if (option && list.current) {
      const parent=list.current;
      if(option.offsetTop<parent.scrollTop) parent.scrollTop=option.offsetTop;
      else if(option.offsetTop+option.offsetHeight>parent.scrollTop+parent.clientHeight) parent.scrollTop=option.offsetTop+option.offsetHeight-parent.clientHeight;
    }
  },[shown,active,position]);
  useEffect(()=>{
    if (!shown) return;
    const outside=(event:PointerEvent)=>{if(!trigger.current?.contains(event.target as Node) && !list.current?.contains(event.target as Node)) setOpen(false);};
    document.addEventListener("pointerdown",outside);
    return ()=>document.removeEventListener("pointerdown",outside);
  },[shown]);
  function keyboard(event:KeyboardEvent<HTMLButtonElement>) {
    if(event.key==="Tab") {setOpen(false);return;}
    if(event.key==="Escape") {event.preventDefault();setOpen(false);return;}
    if(["ArrowDown","ArrowUp","Home","End","PageDown","PageUp"].includes(event.key)) {
      event.preventDefault();
      let next=shown?active:selected;
      if(shown) next=event.key==="Home"?0:event.key==="End"?languages.length-1:next+(event.key==="ArrowDown"?1:event.key==="ArrowUp"?-1:event.key==="PageDown"?8:-8);
      setActive(Math.max(0,Math.min(languages.length-1,next)));setOpen(true);return;
    }
    if(event.key==="Enter" || event.key===" ") {
      event.preventDefault();if(shown)choose(active);else{setActive(selected);setOpen(true);}return;
    }
    if(event.key.length===1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now=performance.now();
      search.current={text:(now-search.current.time<700?search.current.text:"")+event.key,time:now};
      const normalize=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es");
      const match=languages.findIndex(([,label])=>normalize(label).startsWith(normalize(search.current.text)));
      if(match>=0){setActive(match);setOpen(true);}
    }
  }
  return <>
    <button ref={trigger} id="language" className="language-trigger" role="combobox" type="button" aria-labelledby="language-label" aria-haspopup="listbox" aria-expanded={shown} aria-controls={shown?"language-options":undefined} aria-activedescendant={shown?`language-option-${active}`:undefined} disabled={disabled} onKeyDown={keyboard} onBlur={()=>setOpen(false)} onClick={()=>{setActive(selected);setOpen(!shown);}}>
      <span>{languages[selected][1]}</span><ChevronDown size={15} aria-hidden="true"/>
    </button>
    {shown && createPortal(<ul ref={list} id="language-options" role="listbox" aria-labelledby="language-label" className="language-list" style={position} onMouseDown={event=>event.preventDefault()}>
      {languages.map(([code,label],index)=><li id={`language-option-${index}`} key={code} role="option" aria-selected={value===code} className={active===index?"active":""} onPointerMove={()=>setActive(index)} onClick={()=>choose(index)}><span>{label}</span>{value===code && <Check size={15} aria-hidden="true"/>}</li>)}
    </ul>,document.body)}
  </>;
}
