'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql';

const HELLO_WORLD_QUERY = `
  query HelloWorld {
    helloWorld {
      id
      text
      createdAt
    }
  }
`;

const CREATE_MESSAGE_MUTATION = `
  mutation CreateHelloMessage($text: String) {
    createHelloMessage(text: $text) {
      id
      text
      createdAt
    }
  }
`;

export default function HelloWorld() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['helloWorld'],
    queryFn: async () => {
      const { helloWorld } = await graphqlClient.request(HELLO_WORLD_QUERY);
      return helloWorld;
    },
  });

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const { createHelloMessage } = await graphqlClient.request(CREATE_MESSAGE_MUTATION, { text });
      return createHelloMessage;
    },
  });

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mensaje del Backend:</h1>
      {data ? (
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-lg">{data.text}</p>
          <p className="text-sm text-gray-500">
            Creado el: {new Date(data.createdAt).toLocaleString()}
          </p>
        </div>
      ) : (
        <p>No hay mensajes aún</p>
      )}

      <button
        onClick={() => mutation.mutate('¡Hola desde el frontend!')}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Crear Nuevo Mensaje
      </button>
    </div>
  );
}