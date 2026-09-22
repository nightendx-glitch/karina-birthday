"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Lock, Gift, Sparkles } from "lucide-react";

export function GiftSection() {
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    const { data } = await supabase.from("gifts").select("*").order("created_at");
    if (data) setGifts(data);
    setLoading(false);
  };

  const bookGift = async (id: string, giftTitle: string) => {
    const res = await fetch('/api/book-gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ giftId: id })
    });
    
    if (res.ok) {
      fetchGifts(); 
    } else {
      const errorData = await res.json();
      alert(errorData.error || "Этот подарок уже забронирован!");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4">
      <div className="w-8 h-8 border-4 border-red-800 border-t-white rounded-full animate-spin"></div>
      <p className="text-sm opacity-60">Загрузка списка подарков...</p>
    </div>
  );

  return (
    <div className="space-y-6 bg-red-950/40 p-6 rounded-3xl backdrop-blur-md border border-red-900/50 shadow-2xl">
      <div className="text-center space-y-2">
        <Sparkles className="w-6 h-6 mx-auto text-red-400 mb-2" />
        <h2 className="text-3xl serif italic">Список подарков</h2>
        <p className="text-xs opacity-60 max-w-xs mx-auto">
          Вы можете забронировать один из подарков, чтобы другие гости знали, что дарить.
        </p>
      </div>
      
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {gifts.length === 0 && (
          <p className="text-center text-sm opacity-50 py-10">Список подарков пока пуст</p>
        )}
        
        {gifts.map((gift, index) => (
          <motion.div 
            key={gift.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex justify-between items-center p-4 rounded-2xl border transition-all duration-300 ${
              gift.is_booked 
                ? 'bg-red-950/60 border-red-900/30 opacity-70' 
                : 'bg-red-900/20 border-red-800/50 hover:border-red-500/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Gift size={18} className={gift.is_booked ? "text-red-900" : "text-red-300"} />
              <span className={`text-sm ${gift.is_booked ? 'line-through opacity-50' : 'opacity-90'}`}>
                {gift.title}
              </span>
            </div>
            
            {gift.is_booked ? (
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-red-400/70 bg-red-900/30 px-3 py-1 rounded-full">
                <Lock size={12} /> Занято
              </span>
            ) : (
              <button 
                onClick={() => bookGift(gift.id, gift.title)}
                className="px-5 py-2 bg-white text-red-950 text-[10px] font-bold rounded-full hover:bg-gray-200 transition-all uppercase tracking-widest hover:scale-105 active:scale-95"
              >
                Забронировать
              </button>
            )}
          </motion.div>
        ))}
      </div>
      
      <div className="text-center pt-4 border-t border-red-900/30">
        <p className="text-xs opacity-50 serif italic">До встречи на моём особенном вечере ❤️</p>
      </div>
    </div>
  );
}