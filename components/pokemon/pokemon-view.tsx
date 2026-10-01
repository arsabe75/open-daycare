"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface PokemonType {
  type: {
    name: string;
  };
}

interface PokemonStat {
  base_stat: number;
  stat: {
    name: string;
  };
}

interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
  };
  types: PokemonType[];
  stats: PokemonStat[];
}

async function fetchPokemonById(id: number): Promise<Pokemon> {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Pokémon #${id}`);
  }

  return response.json();
}

function formatName(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function PokemonView() {
  const [currentId, setCurrentId] = useState(1);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchPokemonById(currentId)
      .then((data) => {
        if (!cancelled) {
          setPokemon(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentId]);

  const handlePrevious = () => {
    setIsLoading(true);
    setError(null);
    setCurrentId((id) => Math.max(1, id - 1));
  };

  const handleNext = () => {
    setIsLoading(true);
    setError(null);
    setCurrentId((id) => id + 1);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
          Current Pokémon
        </h1>

        {isLoading && (
          <p className="py-8 text-center text-gray-600">Loading...</p>
        )}

        {!isLoading && error && (
          <p className="py-8 text-center text-red-600" role="alert">
            {error}
          </p>
        )}

        {!isLoading && !error && pokemon && (
          <div className="flex flex-col items-center gap-4">
            {pokemon.sprites.front_default ? (
              <Image
                src={pokemon.sprites.front_default}
                alt={`${pokemon.name} sprite`}
                width={160}
                height={160}
                className="object-contain"
                priority={currentId === 1}
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                No image
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500">#{pokemon.id}</p>
              <h2 className="text-3xl font-semibold capitalize text-gray-900">
                {formatName(pokemon.name)}
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {pokemon.types.map(({ type }) => (
                <span
                  key={type.name}
                  className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium capitalize text-blue-800"
                >
                  {type.name}
                </span>
              ))}
            </div>

            <ul className="w-full space-y-1 text-sm text-gray-700">
              {pokemon.stats.slice(0, 3).map(({ stat, base_stat }) => (
                <li key={stat.name} className="flex justify-between capitalize">
                  <span>{stat.name.replace(/-/g, " ")}</span>
                  <span className="font-medium">{base_stat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentId <= 1 || isLoading}
            className="flex-1 rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
