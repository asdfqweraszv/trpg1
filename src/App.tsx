import { useState } from 'react';
import CharacterList from './pages/CharacterList';
import CreateCharacter from './pages/CreateCharacter';
import CharacterSheet from './pages/CharacterSheet';

type Page =
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'sheet'; id: string };

export default function App() {
  const [page, setPage] = useState<Page>({ type: 'list' });

  if (page.type === 'create') {
    return (
      <CreateCharacter
        onBack={() => setPage({ type: 'list' })}
        onCreated={(id) => setPage({ type: 'sheet', id })}
      />
    );
  }

  if (page.type === 'sheet') {
    return (
      <CharacterSheet
        characterId={page.id}
        onBack={() => setPage({ type: 'list' })}
      />
    );
  }

  return (
    <CharacterList
      onSelect={(id) => setPage({ type: 'sheet', id })}
      onCreate={() => setPage({ type: 'create' })}
    />
  );
}
