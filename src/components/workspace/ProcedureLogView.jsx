import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import SurgeryCard from "./SurgeryCard";
import SurgeryDetailPanel from "./SurgeryDetailPanel";

export default function ProcedureLogView({ myEntries, userEmail, onClose }) {
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState(null);

  const pending = myEntries.filter((e) => !(e.logged_by || []).includes(userEmail));
  const logged = myEntries.filter((e) => (e.logged_by || []).includes(userEmail));

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const entry = myEntries.find((e) => e.id === draggableId);
    if (!entry) return;

    const isNowLogged = destination.droppableId === "logged";
    const current = entry.logged_by || [];
    const next = isNowLogged
      ? [...current, userEmail]
      : current.filter((x) => x !== userEmail);

    try {
      await base44.entities.SurgicalLogEntry.update(entry.id, { logged_by: next });
      queryClient.invalidateQueries({ queryKey: ["surgical-logs-mine"] });
      queryClient.invalidateQueries({ queryKey: ["surgical-logs"] });
      toast.success(isNowLogged ? "Marked as logged" : "Moved to pending");
    } catch {
      toast.error("Failed to update entry");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-white/5 flex-shrink-0">
        <h2 className="text-sm font-semibold text-white">My Procedure Log</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT: Detail panel */}
        <div className="w-80 flex-shrink-0 border-r border-white/10 p-4 overflow-y-auto bg-white/3">
          {selectedEntry ? (
            <SurgeryDetailPanel
              entry={selectedEntry}
              userEmail={userEmail}
              onClose={() => setSelectedEntry(null)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-white/8 flex items-center justify-center mb-3">
                <GripVertical className="w-5 h-5 text-white/25" />
              </div>
              <p className="text-sm text-white/30">Click any surgery card to view details &amp; copy info</p>
            </div>
          )}
        </div>

        {/* MIDDLE + RIGHT: Kanban columns */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-1 min-w-0 divide-x divide-white/10">
            {/* MIDDLE: Pending */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-amber-400">{pending.length}</span>
                </div>
                <span className="text-sm font-medium text-white/70">Pending</span>
                <span className="text-xs text-white/30 ml-1">— drag to Logged →</span>
              </div>
              <Droppable droppableId="pending">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-3 space-y-2 transition-colors ${
                      snapshot.isDraggingOver ? "bg-amber-500/5" : ""
                    }`}
                  >
                    {pending.length === 0 && (
                      <p className="text-xs text-white/25 text-center py-8">No pending procedures</p>
                    )}
                    {pending.map((entry, index) => (
                      <Draggable key={entry.id} draggableId={entry.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <SurgeryCard
                              entry={entry}
                              onClick={() => setSelectedEntry(entry)}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* RIGHT: Logged */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-green-400">{logged.length}</span>
                </div>
                <span className="text-sm font-medium text-white/70">Logged</span>
              </div>
              <Droppable droppableId="logged">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-3 space-y-2 transition-colors ${
                      snapshot.isDraggingOver ? "bg-green-500/5" : ""
                    }`}
                  >
                    {logged.length === 0 && (
                      <p className="text-xs text-white/25 text-center py-8">No logged procedures yet</p>
                    )}
                    {logged.map((entry, index) => (
                      <Draggable key={entry.id} draggableId={entry.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <SurgeryCard
                              entry={entry}
                              onClick={() => setSelectedEntry(entry)}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}