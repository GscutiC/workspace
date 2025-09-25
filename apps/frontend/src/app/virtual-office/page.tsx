import { VirtualOffice } from '@/components/VirtualOffice';
import { ClientOnly } from '@/components/ClientOnly';

export default function VirtualOfficePage() {
  return (
    <div className="h-full w-full overflow-hidden bg-white">
      <ClientOnly fallback={
        <div className="flex items-center justify-center h-full w-full bg-gray-900 text-white">
          <div className="text-center">
            <div className="text-xl mb-2">🏙️ Oficina Virtual</div>
            <div className="text-sm text-gray-400">Loading...</div>
          </div>
        </div>
      }>
        <VirtualOffice />
      </ClientOnly>
    </div>
  );
}