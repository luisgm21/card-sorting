import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Card, Category, StudySettings } from '../../api/studies';

interface StudyFormData {
  title: string;
  description: string;
  type: 'open' | 'closed' | 'hybrid';
  cards: Card[];
  predefinedCategories: Category[];
  settings: StudySettings;
}

interface StudyFormProps {
  initialData?: StudyFormData;
  onSubmit: (data: StudyFormData) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
  errors?: { field: string; message: string }[];
  setErrors?: (errors: { field: string; message: string }[]) => void;
}

const defaultSettings: StudySettings = {
  maxCardsPerCategory: null,
  minCardsPerCategory: 0,
  allowUncategorized: true,
  timeLimit: null,
  shuffleCards: false,
};

const StudyForm = ({ initialData, onSubmit, isSubmitting, submitLabel, errors: propErrors, setErrors }: StudyFormProps) => {
  const [form, setForm] = useState<StudyFormData>(
    initialData || {
      title: '',
      description: '',
      type: 'open',
      cards: [],
      predefinedCategories: [],
      settings: { ...defaultSettings },
    }
  );

  const [internalErrors, setInternalErrors] = useState<{ field: string; message: string }[]>([]);
  const errors = propErrors !== undefined ? propErrors : internalErrors;
  const updateErrors = setErrors !== undefined ? setErrors : setInternalErrors;

  const [newCardText, setNewCardText] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    updateErrors(errors.filter((error) => error.field !== name));
  };

  const handleSettingChange = (name: keyof StudySettings, value: any) => {
    setForm((prev) => ({
      ...prev,
      settings: { ...prev.settings, [name]: value },
    }));
  };

  const addCard = () => {
    if (!newCardText.trim()) {
      toast.error('El texto de la tarjeta es requerido');
      return;
    }
    const newCard: Card = {
      id: crypto.randomUUID(),
      text: newCardText.trim(),
      description: newCardDesc.trim() || undefined,
    };
    setForm((prev) => ({ ...prev, cards: [...prev.cards, newCard] }));
    setNewCardText('');
    setNewCardDesc('');
  };

  const removeCard = (cardId: string) => {
    setForm((prev) => ({ ...prev, cards: prev.cards.filter((c) => c.id !== cardId) }));
  };

  const addCategory = () => {
    if (!newCatName.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }
    const newCat: Category = {
      id: crypto.randomUUID(),
      name: newCatName.trim(),
      description: newCatDesc.trim() || undefined,
    };
    setForm((prev) => ({
      ...prev,
      predefinedCategories: [...prev.predefinedCategories, newCat],
    }));
    setNewCatName('');
    setNewCatDesc('');
  };

  const removeCategory = (catId: string) => {
    setForm((prev) => ({
      ...prev,
      predefinedCategories: prev.predefinedCategories.filter((c) => c.id !== catId),
    }));
  };

  const showCategories = form.type === 'closed' || form.type === 'hybrid';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(form);
    } catch (error: any) {
      if (error.response?.data?.errors) {
        updateErrors(error.response.data.errors);
      } else {
        toast.error('Error inesperado al enviar el formulario');
      }
    }
  };

  const getErrorMessage = (field: string) => {
    const error = errors.find((err) => err.field === field);
    return error ? error.message : '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errors.length > 0 && errors.every(e => !e.field) && (
        <div className="text-red-500 text-sm mb-2">{errors[0].message}</div>
      )}
      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
        <div className="space-y-4">
          <div>
            {getErrorMessage('title') && (
              <p className="text-red-500 text-sm mb-1">{getErrorMessage('title')}</p>
            )}
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${getErrorMessage('title') ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Nombre del estudio"
            />
          </div>
          <div>
            {getErrorMessage('description') && (
              <p className="text-red-500 text-sm mb-1">{getErrorMessage('description')}</p>
            )}
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${getErrorMessage('description') ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Descripción del estudio"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de estudio <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="open">Abierto (Open) - Los participantes crean sus categorías</option>
              <option value="closed">Cerrado (Closed) - Categorías predefinidas</option>
              <option value="hybrid">Híbrido (Hybrid) - Categorías predefinidas + nuevas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarjetas</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {form.cards.map((card, idx) => (
            <div
              key={card.id}
              className="group relative bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8"
            >
              <span className="text-sm text-gray-700">{card.text}</span>
              <button
                type="button"
                onClick={() => removeCard(card.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newCardText}
            onChange={(e) => setNewCardText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCard())}
            placeholder="Texto de la tarjeta"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            value={newCardDesc}
            onChange={(e) => setNewCardDesc(e.target.value)}
            placeholder="Descripción (opcional)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            type="button"
            onClick={addCard}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            + Agregar
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">{form.cards.length} tarjeta(s) agregada(s)</p>
      </div>

      {/* Categories (only for closed/hybrid) */}
      {showCategories && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorías Predefinidas</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.predefinedCategories.map((cat) => (
              <div
                key={cat.id}
                className="group relative bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 pr-8"
              >
                <span className="text-sm text-indigo-700 font-medium">{cat.name}</span>
                {cat.description && (
                  <span className="text-xs text-indigo-500 ml-1">- {cat.description}</span>
                )}
                <button
                  type="button"
                  onClick={() => removeCategory(cat.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
              placeholder="Nombre de la categoría"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              placeholder="Descripción (opcional)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              type="button"
              onClick={addCategory}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              + Agregar
            </button>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Máx. tarjetas por categoría
            </label>
            <input
              type="number"
              value={form.settings.maxCardsPerCategory ?? ''}
              onChange={(e) =>
                handleSettingChange(
                  'maxCardsPerCategory',
                  e.target.value ? Number(e.target.value) : null
                )
              }
              placeholder="Sin límite"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Límite de tiempo (minutos)
            </label>
            <input
              type="number"
              value={form.settings.timeLimit ?? ''}
              onChange={(e) =>
                handleSettingChange(
                  'timeLimit',
                  e.target.value ? Number(e.target.value) : null
                )
              }
              placeholder="Sin límite"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.settings.shuffleCards}
              onChange={(e) => handleSettingChange('shuffleCards', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Barajar tarjetas</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.settings.allowUncategorized}
              onChange={(e) => handleSettingChange('allowUncategorized', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Permitir tarjetas sin categoría</span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
};

export default StudyForm;
