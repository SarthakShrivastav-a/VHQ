import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  socketId?: string;
  usersCount: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, socketId, usersCount }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-md p-3 text-xs z-50 w-56">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium">Connection Status</div>
        <div className={`flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}></div>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      {isConnected && (
        <>
          <div className="text-gray-600 mb-1">
            <span className="inline-block w-24">Socket ID:</span> 
            <span className="font-mono text-gray-800 truncate">{socketId}</span>
          </div>
          <div className="text-gray-600">
            <span className="inline-block w-24">Active Users:</span> 
            <span className="font-medium text-gray-800">{usersCount}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus; 