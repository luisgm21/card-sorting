import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { studiesApi, type Card, type Category } from '../api/studies';
import { participationsApi, type CompleteParticipationData } from '../api/participations';
import PageLoader from '../components/ui/PageLoader';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Draggable Card ---
const DraggableCard = ({ card, isOverlay = false }: { card: Card; isOverlay?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${card.id}`,
    data: { card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white border-2 border-blue-200 rounded-lg px-4 py-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
        isOverlay ? 'shadow-lg rotate-2 border-blue-400' : ''
      }`}
    >
      <p className="text-sm font-medium text-gray-800">{card.text}</p>
      {card.description && (
        <p className="text-xs text-gray-500 mt-0.5">{card.description}</p>
      )}
    </div>
  );
};

// --- Card Overlay ---
const CardOverlay = ({ card }: { card: Card }) => (
  <div className="bg-white border-2 border-blue-400 rounded-lg px-4 py-3 shadow-lg rotate-2">
    <p className="text-sm font-medium text-gray-800">{card.text}</p>
    {card.description && (
      <p className="text-xs text-gray-500 mt-0.5">{card.description}</p>
    )}
  </div>
);

// --- Uncategorized Area ---
const UncategorizedZone = ({ cards }: { cards: Card[] }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'uncategorized' });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-50 bg-gray-50 border-2 border-dashed rounded-xl p-4 transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
      }`}
    >
      <h3 className="text-sm font-semibold text-gray-500 mb-3">Sin categoría ({cards.length})</h3>
      <div className="flex flex-wrap gap-2">
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
};

// --- Category Column ---
const CategoryColumn = ({
  category,
  cards,
  isHybrid,
  onRemoveCategory,
}: {
  category: Category;
  cards: Card[];
  isHybrid: boolean;
  onRemoveCategory?: (id: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `cat-${category.id}`, data: { category } });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white border-2 rounded-xl p-4 transition-colors min-h-75 ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-indigo-700">{category.name}</h3>
        <span className="text-xs text-gray-400">{cards.length} tarjetas</span>
        {isHybrid && onRemoveCategory && (
          <button
            onClick={() => onRemoveCategory(category.id)}
            className="text-red-400 hover:text-red-600 text-xs ml-2"
          >
            ×
          </button>
        )}
      </div>
      {category.description && (
        <p className="text-xs text-gray-500 mb-3">{category.description}</p>
      )}
      <div className="space-y-2">
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} />
        ))}
      </div>
      {cards.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-8">Arrastra tarjetas aquí</p>
      )}
    </div>
  );
};

// --- Main Component ---
interface StudyData {
  _id: string;
  title: string;
  description: string;
  cards: Card[];
  predefinedCategories?: Category[];
  type: 'open' | 'closed' | 'hybrid';
  settings: {
    maxCardsPerCategory: number | null;
    minCardsPerCategory: number;
    allowUncategorized: boolean;
    timeLimit: number | null;
    shuffleCards: boolean;
  };
}

const StudySort = () => {
  const { link } = useParams<{ link: string }>();
  const [study, setStudy] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const [started, setStarted] = useState(false);
  const [participationId, setParticipationId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Card assignments: cardId -> categoryId (or 'uncategorized')
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  // Custom categories (for open/hybrid)
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  // Comments and difficulty
  const [comments, setComments] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  // Drag state
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  // Timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  useEffect(() => {
    if (!link) return;
    loadStudy();
  }, [link]);

  const loadStudy = async () => {
    try {
      const res = await studiesApi.getByLink(link!);
      if (res.success) {
        const s = res.data;
        setStudy(s);
        // Initialize assignments
        const initial: Record<string, string> = {};
        s.cards.forEach((card: Card) => {
          initial[card.id] = 'uncategorized';
        });
        setAssignments(initial);
      } else {
        toast.error('Estudio no encontrado');
      }
    } catch {
      toast.error('Error al cargar el estudio');
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (!started || !study?.settings.timeLimit) return;
    const totalSeconds = study.settings.timeLimit * 60;
    setTimeLeft(totalSeconds);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          toast.error('Tiempo agotado');
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, study?.settings.timeLimit]);

  const handleStart = async () => {
    if (!consentGiven) {
      toast.error('Debes aceptar el consentimiento');
      return;
    }
    try {
      const res = await participationsApi.start({ studyLink: link!, consentGiven: true });
      if (res.success) {
        setParticipationId(res.data._id);
        setStarted(true);
        setStartTime(Date.now());
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al iniciar la participación');
    }
  };

  const getCardsByCategory = (categoryId: string) => {
    const cardIds = Object.entries(assignments)
      .filter(([_, catId]) => catId === categoryId)
      .map(([cardId]) => cardId);
    return (study?.cards || []).filter((c) => cardIds.includes(c.id));
  };

  const getUncategorizedCards = () => {
    return (study?.cards || []).filter((c) => assignments[c.id] === 'uncategorized');
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = event.active.data.current?.card as Card;
    setActiveCard(card);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = active.data.current?.card?.id;
    if (!cardId) return;

    let targetId: string;
    if (over.id === 'uncategorized') {
      targetId = 'uncategorized';
    } else if (typeof over.id === 'string' && over.id.startsWith('cat-')) {
      targetId = over.id.replace('cat-', '');
    } else if (typeof over.id === 'string' && over.id.startsWith('card-')) {
      // Dropped on another card - find its category
      const overCardId = over.id.replace('card-', '');
      const overCategory = Object.entries(assignments).find(
        ([id]) => id === overCardId
      )?.[1];
      targetId = overCategory || 'uncategorized';
    } else {
      return;
    }

    setAssignments((prev) => ({ ...prev, [cardId]: targetId }));
  };

  const addCustomCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: crypto.randomUUID(),
      name: newCatName.trim(),
    };
    setCustomCategories((prev) => [...prev, newCat]);
    setNewCatName('');
  };

  const removeCustomCategory = (catId: string) => {
    setCustomCategories((prev) => prev.filter((c) => c.id !== catId));
    // Move cards back to uncategorized
    setAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((cardId) => {
        if (next[cardId] === catId) next[cardId] = 'uncategorized';
      });
      return next;
    });
  };

  const handleSubmit = async (timedOut = false) => {
    if (!participationId || !study) return;
    setIsSubmitting(true);
    try {
      const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      const data: CompleteParticipationData = {
        assignments,
        timeSpent,
        cardOrder: study.cards.map((c) => c.id),
      };
      if (comments.trim()) data.comments = comments.trim();
      if (!timedOut) data.difficulty = difficulty;
      if (customCategories.length > 0) {
        data.customCategories = customCategories;
      }

      await participationsApi.complete(participationId, data);
      toast.success(timedOut ? 'Tiempo agotado. Tus respuestas fueron guardadas.' : '¡Participación completada!');
      setStarted(false);
    } catch (err: any) {
      toast.error('Error al enviar resultados');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!study) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Estudio no encontrado</h2>
          <p className="text-gray-500 mt-2">El link no es válido o el estudio ha sido cerrado.</p>
        </div>
      </div>
    );
  }

  // --- Welcome Screen ---
  if (!started) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{study.title}</h1>
          <p className="text-gray-600 mb-6 whitespace-pre-wrap">{study.description}</p>

          {study.settings.timeLimit && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg mb-6">
              <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-yellow-700">Este estudio tiene un límite de {study.settings.timeLimit} minutos.</span>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Instrucciones:</strong> Arrastra cada tarjeta a la categoría que consideres más adecuada.
              {study.type === 'open' && ' Puedes crear tus propias categorías.'}
              {study.type === 'hybrid' && ' Puedes crear nuevas categorías si lo necesitas.'}
            </p>
            <p className="text-xs text-gray-500">
              {study.cards.length} tarjetas para clasificar
              {study.predefinedCategories && study.predefinedCategories.length > 0 && ` en ${study.predefinedCategories.length} categorías`}.
            </p>
          </div>

          <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              Acepto participar en este estudio de forma voluntaria y autorizo el uso de mis datos para fines de investigación.
            </span>
          </label>

          <button
            onClick={handleStart}
            disabled={!consentGiven}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Comenzar
          </button>
        </div>
      </div>
    );
  }

  // --- Timer ---
  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;

  // Get all categories (predefined + custom)
  const allCategories = [
    ...(study.predefinedCategories || []),
    ...customCategories,
  ];

  // Check if study is completed (already submitted, show thank you)
  const isCompleted = !started && participationId;

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por participar!</h2>
          <p className="text-gray-500">Tus respuestas han sido registradas exitosamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{study.title}</h1>
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <span className={`text-sm font-mono font-bold px-3 py-1 rounded-lg ${
                timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            )}
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Finalizar'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Sorting Area */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Uncategorized Area */}
            {(study.settings.allowUncategorized || study.type === 'open') && (
              <UncategorizedZone cards={getUncategorizedCards()} />
            )}

            {/* Category Columns */}
            {allCategories.map((cat) => (
              <CategoryColumn
                key={cat.id}
                category={cat}
                cards={getCardsByCategory(cat.id)}
                isHybrid={study.type === 'hybrid' || study.type === 'open'}
                onRemoveCategory={
                  customCategories.some((c) => c.id === cat.id)
                    ? removeCustomCategory
                    : undefined
                }
              />
            ))}

            {/* Add Category (for open/hybrid) */}
            {(study.type === 'open' || study.type === 'hybrid') && (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-50">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomCategory()}
                  placeholder="Nueva categoría..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-2"
                />
                <button
                  onClick={addCustomCategory}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Agregar categoría
                </button>
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? <CardOverlay card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Bottom Bar: Comments & Difficulty */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Comentarios adicionales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Comentarios (opcional)</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder="¿Algún comentario sobre el estudio?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Dificultad del estudio: {difficulty}/5
              </label>
              <input
                type="number"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Muy fácil</span>
                <span>Muy difícil</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySort;
