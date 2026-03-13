export type Leader = {
  id: string;
  name: string;
  phone: string;
  zone: string;
  notes: string;
};

const initialLeaders: Leader[] = [];

let leaders = [...initialLeaders];

export function listLeaders() {
  return leaders;
}

export function addLeader(input: Omit<Leader, "id"> & { id?: string }) {
  const newLeader: Leader = {
    id: input.id ?? crypto.randomUUID(),
    ...input,
  };
  leaders = [newLeader, ...leaders];
  return newLeader;
}

export function updateLeader(id: string, updates: Partial<Omit<Leader, "id">>) {
  const index = leaders.findIndex((leader) => leader.id === id);
  if (index === -1) {
    return null;
  }
  leaders[index] = { ...leaders[index], ...updates };
  return leaders[index];
}

export function deleteLeader(id: string) {
  const exists = leaders.some((leader) => leader.id === id);
  leaders = leaders.filter((leader) => leader.id !== id);
  return exists;
}
