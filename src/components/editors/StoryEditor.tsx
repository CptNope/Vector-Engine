import { useState } from 'react';
import { useGameStore } from '../../store';
import { StoryNode } from '../../types';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

export default function StoryEditor() {
  const { gameData, updateStoryNode, addStoryNode, deleteStoryNode, setStartNode } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(gameData.storyNodes[0]?.id || null);

  const selectedNode = gameData.storyNodes.find(n => n.id === selectedId);

  const handleAdd = () => {
    const newNode: StoryNode = {
      id: `s_${Date.now()}`,
      title: 'New Story Node',
      text: 'Enter story text here...',
      choices: [],
    };
    addStoryNode(newNode);
    setSelectedId(newNode.id);
  };

  const handleAddChoice = () => {
    if (!selectedNode) return;
    updateStoryNode({
      ...selectedNode,
      choices: [
        ...selectedNode.choices,
        { id: `c_${Date.now()}`, text: 'New Choice', nextLevelId: null, nextStoryNodeId: null }
      ]
    });
  };

  const handleDeleteChoice = (choiceId: string) => {
    if (!selectedNode) return;
    updateStoryNode({
      ...selectedNode,
      choices: selectedNode.choices.filter(c => c.id !== choiceId)
    });
  };

  const updateChoice = (choiceId: string, updates: Partial<StoryNode['choices'][0]>) => {
    if (!selectedNode) return;
    updateStoryNode({
      ...selectedNode,
      choices: selectedNode.choices.map(c => c.id === choiceId ? { ...c, ...updates } : c)
    });
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="font-semibold text-zinc-200">Story Nodes</h2>
          <button onClick={handleAdd} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {gameData.storyNodes.map(n => (
            <button
              key={n.id}
              onClick={() => setSelectedId(n.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between ${selectedId === n.id ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800/50'}`}
            >
              <span className="truncate">{n.title}</span>
              {gameData.startStoryNodeId === n.id && (
                <span className="text-[10px] uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Start</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedNode ? (
          <div className="max-w-3xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-zinc-100">Edit Story Node</h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStartNode(selectedNode.id)}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${gameData.startStoryNodeId === selectedNode.id ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                >
                  Set as Start Node
                </button>
                <button 
                  onClick={() => { deleteStoryNode(selectedNode.id); setSelectedId(null); }}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Title</label>
                <input 
                  type="text" 
                  value={selectedNode.title}
                  onChange={e => updateStoryNode({ ...selectedNode, title: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Story Text</label>
                <textarea 
                  value={selectedNode.text}
                  onChange={e => updateStoryNode({ ...selectedNode, text: e.target.value })}
                  rows={6}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none font-serif"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-zinc-200">Choices</h3>
                  <button 
                    onClick={handleAddChoice}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300 transition-colors"
                  >
                    <Plus size={16} /> Add Choice
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedNode.choices.map((choice, index) => (
                    <div key={choice.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1 mr-4">
                          <label className="text-xs text-zinc-500 uppercase font-semibold">Choice Text</label>
                          <input 
                            type="text" 
                            value={choice.text}
                            onChange={e => updateChoice(choice.id, { text: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <button 
                          onClick={() => handleDeleteChoice(choice.id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded mt-5"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-zinc-500 uppercase font-semibold flex items-center gap-1">
                            <ArrowRight size={12} /> Next Story Node
                          </label>
                          <select 
                            value={choice.nextStoryNodeId || ''}
                            onChange={e => updateChoice(choice.id, { nextStoryNodeId: e.target.value || null, nextLevelId: null })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">None</option>
                            {gameData.storyNodes.filter(n => n.id !== selectedNode.id).map(n => (
                              <option key={n.id} value={n.id}>{n.title}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-zinc-500 uppercase font-semibold flex items-center gap-1">
                            <ArrowRight size={12} /> Or Start Level
                          </label>
                          <select 
                            value={choice.nextLevelId || ''}
                            onChange={e => updateChoice(choice.id, { nextLevelId: e.target.value || null, nextStoryNodeId: null })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">None</option>
                            {gameData.levels.map(l => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedNode.choices.length === 0 && (
                    <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                      No choices defined. This will be an end node.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Select or create a story node to edit
          </div>
        )}
      </div>
    </div>
  );
}
