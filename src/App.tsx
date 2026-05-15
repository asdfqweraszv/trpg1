import CharacterList from './pages/CharacterList';
import CreateCharacter from './pages/CreateCharacter';
import CharacterSheet from './pages/CharacterSheet';
import { createAvatarsBucket } from './lib/supabase';
import { useState, useEffect } from 'react';

type Page =
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'sheet'; id: string };

export default function App() {
  const [page, setPage] = useState<Page>({ type: 'list' });
  const [masterMode, setMasterMode] = useState(false);
    useEffect(() => {
    createAvatarsBucket();
  }, []);

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
        masterMode={masterMode}
        setMasterMode={setMasterMode}
      />
    );
  }

  return (
    <CharacterList
      onSelect={(id) => setPage({ type: 'sheet', id })}
      onCreate={() => setPage({ type: 'create' })}
      masterMode={masterMode}
      setMasterMode={setMasterMode}
    />
  );
}
