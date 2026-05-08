interface ResultsMatrixProps {
  matrix: Record<string, Record<string, number>>;
  studyTitle: string;
  totalResponses: number;
  averageTime: number;
}

const ResultsMatrix = ({ matrix, studyTitle, totalResponses, averageTime }: ResultsMatrixProps) => {
  const cardIds = Object.keys(matrix);
  if (cardIds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay suficientes datos para mostrar la matriz de co-ocurrencia.
      </div>
    );
  }

  const maxVal = Math.max(
    ...cardIds.flatMap((id) =>
      cardIds.map((id2) => matrix[id]?.[id2] ?? 0)
    )
  );

  const getIntensity = (value: number) => {
    if (maxVal === 0) return 'bg-white';
    const intensity = value / maxVal;
    if (intensity === 0) return 'bg-white';
    if (intensity <= 0.25) return 'bg-blue-100';
    if (intensity <= 0.5) return 'bg-blue-200';
    if (intensity <= 0.75) return 'bg-blue-300';
    return 'bg-blue-400';
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Respuestas</p>
          <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Tiempo Promedio</p>
          <p className="text-2xl font-bold text-gray-900">{Math.round(averageTime / 60)} min</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Tarjetas</p>
          <p className="text-2xl font-bold text-gray-900">{cardIds.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                Tarjeta
              </th>
              {cardIds.map((id) => (
                <th
                  key={id}
                  className="px-3 py-2 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase max-w-[120px] truncate"
                  title={id}
                >
                  {id.length > 10 ? id.slice(0, 10) + '...' : id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cardIds.map((rowId, i) => (
              <tr key={rowId}>
                <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap max-w-[120px] truncate" title={rowId}>
                  {i + 1}. {rowId.length > 12 ? rowId.slice(0, 12) + '...' : rowId}
                </td>
                {cardIds.map((colId) => {
                  const val = matrix[rowId]?.[colId] ?? 0;
                  return (
                    <td
                      key={colId}
                      className={`px-3 py-2 text-center ${getIntensity(val)}`}
                    >
                      <span className="text-xs font-medium text-gray-700">{val}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <span>Baja</span>
        <div className="flex gap-0.5">
          <div className="w-4 h-4 bg-white border border-gray-200" />
          <div className="w-4 h-4 bg-blue-100 border border-gray-200" />
          <div className="w-4 h-4 bg-blue-200 border border-gray-200" />
          <div className="w-4 h-4 bg-blue-300 border border-gray-200" />
          <div className="w-4 h-4 bg-blue-400 border border-gray-200" />
        </div>
        <span>Alta</span>
      </div>
    </div>
  );
};

export default ResultsMatrix;
