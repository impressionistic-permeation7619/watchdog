import { useCallback, useState } from "react";

export function useDossierSectionEditor(opts?: { onResetCreate?: () => void }) {
  const onResetCreate = opts?.onResetCreate;
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const handleStartAdding = useCallback(() => {
    setEditId(null);
    setAdding(true);
  }, []);

  const handleStopAdding = useCallback(() => {
    onResetCreate?.();
    setAdding(false);
  }, [onResetCreate]);

  const handleToggleAdding = useCallback(() => {
    if (adding) {
      handleStopAdding();
      return;
    }
    handleStartAdding();
  }, [adding, handleStartAdding, handleStopAdding]);

  const handleOpenEdit = useCallback(
    (id: string) => {
      onResetCreate?.();
      setAdding(false);
      setEditId(id);
    },
    [onResetCreate]
  );

  const handleCloseEdit = useCallback(() => {
    setEditId(null);
  }, []);

  const handleError = useCallback((message: string | null) => {
    setError(message);
  }, []);

  const isEmpty = useCallback(
    (rowCount: number) => rowCount === 0 && !adding,
    [adding]
  );

  return {
    error,
    adding,
    editId,
    handleStartAdding,
    handleStopAdding,
    handleToggleAdding,
    handleOpenEdit,
    handleCloseEdit,
    handleError,
    isEmpty,
  };
}

export type DossierSectionEditor = ReturnType<typeof useDossierSectionEditor>;
