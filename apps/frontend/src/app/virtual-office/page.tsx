import { VirtualOffice } from '@/components/VirtualOffice';

export default function VirtualOfficePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Virtual Office</h1>
              <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                Demo
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Built with Pixi.js + Next.js
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-8rem)]">
          {/* Virtual Office Canvas */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-lg overflow-hidden">
            <VirtualOffice />
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* About */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">About Virtual Office</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  A 2D virtual office space built with Pixi.js and React. Features include:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Real-time avatar movement</li>
                  <li>A* pathfinding navigation</li>
                  <li>Smooth camera controls</li>
                  <li>Interactive chat system</li>
                  <li>Status indicators</li>
                  <li>Performance optimizations</li>
                </ul>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Features</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Movement System</div>
                    <div className="text-xs text-gray-600">Click to move or use WASD keys</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Camera Controls</div>
                    <div className="text-xs text-gray-600">Drag to pan, scroll to zoom</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Pathfinding</div>
                    <div className="text-xs text-gray-600">Intelligent navigation around obstacles</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Chat System</div>
                    <div className="text-xs text-gray-600">Send messages with chat bubbles</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Performance</div>
                    <div className="text-xs text-gray-600">Object pooling and culling optimizations</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rendering Engine</span>
                  <span className="font-medium">Pixi.js WebGL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pathfinding</span>
                  <span className="font-medium">A* Algorithm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Object Pooling</span>
                  <span className="font-medium text-green-600">✓ Enabled</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frustum Culling</span>
                  <span className="font-medium text-green-600">✓ Enabled</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                  Reset Camera
                </button>
                <button className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                  Toggle Debug Mode
                </button>
                <button className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                  Export Screenshot
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}