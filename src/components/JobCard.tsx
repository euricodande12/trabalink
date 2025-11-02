import { motion, PanInfo } from "motion/react";
import { MapPin, Clock, Briefcase } from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  postedTime: string;
  category?: string;
  imageUrl?: string;
  onClick?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function JobCard({
  title,
  company,
  location,
  salary,
  type,
  postedTime,
  category = "General",
  imageUrl,
  onClick,
  onSwipeLeft,
  onSwipeRight,
}: JobCardProps) {
  const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      if (info.offset.x > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (info.offset.x < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    setDragDirection(null);
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 20) {
      setDragDirection("right");
    } else if (info.offset.x < -20) {
      setDragDirection("left");
    } else {
      setDragDirection(null);
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
        dragDirection === "left" ? "bg-red-50 dark:bg-red-900/20" : ""
      } ${dragDirection === "right" ? "bg-green-50 dark:bg-green-900/20" : ""}`}
      onClick={onClick}
    >
      {imageUrl && (
        <div className="h-40 w-full overflow-hidden">
          <ImageWithFallback
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="mb-1">{title}</h3>
            <p className="text-muted-foreground">{company}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            {category}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{location}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm">{type}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-primary">N$ {salary}</span>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            <span>{postedTime}</span>
          </div>
        </div>
      </div>

      {dragDirection && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span className={`px-4 py-2 rounded-xl ${
            dragDirection === "left" ? "bg-red-500 text-white" : "bg-green-500 text-white"
          }`}>
            {dragDirection === "left" ? "Skip" : "Save"}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
