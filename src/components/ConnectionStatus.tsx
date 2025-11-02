import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Database, AlertCircle } from "lucide-react";

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we can access Supabase info
    try {
      import('../utils/supabase/info').then(() => {
        setIsConnected(true);
      }).catch(() => {
        setIsConnected(false);
      });
    } catch {
      setIsConnected(false);
    }
  }, []);

  if (isConnected === null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 right-4 z-40"
    >
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg ${
        isConnected 
          ? 'bg-green-500/10 border border-green-500/20 text-green-500' 
          : 'bg-destructive/10 border border-destructive/20 text-destructive'
      }`}>
        {isConnected ? (
          <>
            <Database className="w-4 h-4" />
            <span className="text-sm">Supabase Connected</span>
            <CheckCircle2 className="w-4 h-4" />
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Offline Mode</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
