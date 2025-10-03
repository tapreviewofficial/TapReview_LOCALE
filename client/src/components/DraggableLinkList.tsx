import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Link } from "@shared/schema";

interface DraggableLinkListProps {
  links: Link[];
}

interface LinkRowProps {
  link: Link;
  onUpdate: (id: number, field: string, value: string) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function SortableLinkRow({ link, onUpdate, onDelete, isUpdating, isDeleting }: LinkRowProps) {
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (title !== link.title) {
      onUpdate(link.id, "title", title);
    }
    if (url !== link.url) {
      onUpdate(link.id, "url", url);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg" 
      data-testid={`link-row-${link.id}`}
    >
      <div {...attributes} {...listeners} className="text-white/40 hover:text-white/80 cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-1 grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium mb-1 text-white/60">Titolo</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/10 border-white/20 text-white"
            data-testid={`input-edit-title-${link.id}`}
          />
        </div>
        <div>
          <Label className="text-sm font-medium mb-1 text-white/60">URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white/10 border-white/20 text-white"
            data-testid={`input-edit-url-${link.id}`}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={isUpdating || (title === link.title && url === link.url)}
          className="bg-[#CC9900] hover:bg-[#CC9900]/80 text-black"
          data-testid={`button-save-link-${link.id}`}
        >
          <i className="fas fa-save"></i>
        </Button>
        <Button
          onClick={() => onDelete(link.id)}
          disabled={isDeleting}
          className="bg-red-600 text-white hover:bg-red-700"
          data-testid={`button-delete-link-${link.id}`}
        >
          <i className="fas fa-trash"></i>
        </Button>
      </div>
    </div>
  );
}

export function DraggableLinkList({ links }: DraggableLinkListProps) {
  const [localLinks, setLocalLinks] = useState(links);
  const { toast } = useToast();

  // Update local state when props change
  useEffect(() => {
    setLocalLinks([...links]);
  }, [links]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PATCH", `/api/links/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api", "links"] });
    },
    onError: (error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/links/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Link eliminato", description: "Il link è stato rimosso con successo" });
      queryClient.invalidateQueries({ queryKey: ["api", "links"] });
    },
    onError: (error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = localLinks.findIndex((link) => link.id === active.id);
      const newIndex = localLinks.findIndex((link) => link.id === over?.id);

      const newLinks = arrayMove(localLinks, oldIndex, newIndex);
      setLocalLinks(newLinks);

      // Update order for all affected links
      newLinks.forEach((link, index) => {
        if (link.order !== index) {
          updateLinkMutation.mutate({ id: link.id, data: { order: index } });
        }
      });
    }
  };

  const handleLinkUpdate = (id: number, field: string, value: string) => {
    updateLinkMutation.mutate({ id, data: { [field]: value } });
  };

  const handleLinkDelete = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questo link?")) {
      deleteLinkMutation.mutate(id);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localLinks.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {localLinks.map((link) => (
            <SortableLinkRow
              key={link.id}
              link={link}
              onUpdate={handleLinkUpdate}
              onDelete={handleLinkDelete}
              isUpdating={updateLinkMutation.isPending}
              isDeleting={deleteLinkMutation.isPending}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}