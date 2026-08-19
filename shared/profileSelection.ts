export type ProfileSelectionResult = {
  ids: string[];
  blocked: boolean;
};

export function updateProfileSelection(
  currentIds: string[],
  id: string,
  limit: number
): ProfileSelectionResult {
  if (currentIds.includes(id)) {
    return {
      ids: currentIds.filter(currentId => currentId !== id),
      blocked: false,
    };
  }

  if (currentIds.length >= limit) {
    return { ids: currentIds, blocked: true };
  }

  return { ids: [...currentIds, id], blocked: false };
}
