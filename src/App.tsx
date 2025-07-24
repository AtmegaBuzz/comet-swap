import { useState, useEffect } from 'react';
import { ArrowDown, Copy, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { useConnection, useActiveAddress } from '@arweave-wallet-kit/react';
import useAo from './hooks/useAo';
import { formatTokenBalance } from './utils';

interface Order {
  id: string;
  quantity: string;
  fulfilled: boolean;
}


export default function App() {
  const [wUSDCAmount, setwUSDCAmount] = useState<string>('');
  const [astroAmount, setAstroAmount] = useState<string>('0');
  const [isLoading, ] = useState<boolean>(false);
  const [, setIsWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [wUsdcBalance, setWusdcBalance] = useState<string>('0');
  const [, setShowProfileModal] = useState<boolean>(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);


  const { getwUSDCBalance, swapTokens, fetchOrders } = useAo()
  const { connected, connect, disconnect } = useConnection();
  let address = useActiveAddress();

  const handleMaxAmount = (): void => {
    setwUSDCAmount(wUsdcBalance);
    setAstroAmount(wUsdcBalance);
  };

  const handleConnectWallet = async (): Promise<void> => {
    if (connected) {
      setIsWalletConnected(false);
      setWalletAddress('');
      setWusdcBalance('0');
      setShowProfileModal(false);
      disconnect();
    } else {
      try {
        setWalletAddress(address || '');
        setIsWalletConnected(true);
        connect();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string, orderId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: boolean) => {
    return status
      ? 'text-green-400 bg-green-400/10'
      : 'text-yellow-400 bg-yellow-400/10';
  };

  const getStatusIcon = (status: boolean) => {
    return status
      ? <CheckCircle className="w-4 h-4" />
      : <Clock className="w-4 h-4" />;
  };

  const handleExternalLink = (orderId: string) => {
    // Replace with your actual external link logic
    const url = `https://www.ao.link/#/message/${orderId}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    setWalletAddress(address || '')
  }, [address])

  useEffect(() => {
    if (walletAddress === "") return;

    const interval = setInterval(() => {
      (async () => {
        const balance = await getwUSDCBalance(walletAddress);
        setWusdcBalance(balance);
      })();
    }, 5000);

    return () => clearInterval(interval);
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress === "") return;

    const interval = setInterval(() => {
      (async () => {
        const orders = await fetchOrders(walletAddress);
        setMyOrders(orders);
      })();
    }, 5000);

    return () => clearInterval(interval);
  }, [walletAddress]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050607' }}>

      <div className="max-w-2xl px-12 mx-auto px-4 py-8">
        <div className='bg-[#0F0F0F] px-5 py-5 border border-[#1B1B1B] rounded-2xl shadow-lg'>
          {/* Bridge Title */}
          <h1 className="text-3xl font-bold text-center mb-12 text-white">Swap</h1>

          {/* Bridge Interface */}
          <div className="space-y-4">
            {/* You Send Section */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#1B1B1B' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400 text-sm">You send</span>
              </div>

              <div className="flex items-center justify-between mb-1">
                <input
                  type="number"
                  value={wUSDCAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setwUSDCAmount(e.target.value); setAstroAmount(e.target.value) }}
                  placeholder="0"
                  className="text-4xl font-light bg-transparent border-none outline-none text-white w-full placeholder-gray-600"
                />
                <div className="flex items-center space-x-2 px-4 py-3 w-[120px]" style={{ backgroundColor: '#0F0F0F' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2563EB' }}>
                    <img src="https://ks7d7wu6grckxrjzbstqbsffbuhck4yi5wkk3s4x5rwumg75deta.arweave.net/VL4_2p40RKvFOQynAMilDQ4lcwjtlK3Ll-xtRhv9GSY" alt="" />
                  </div>
                  <span className="font-medium text-white">wUSDC</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{wUSDCAmount} USD</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Balance: ~{wUsdcBalance} USDC</span>
                  <button className="text-blue-400 hover:text-blue-300 font-medium" onClick={handleMaxAmount}>MAX</button>
                </div>
              </div>

            </div>
            {/* Connect Arweave Wallet Status */}
            <div className="mt-4">
              {!connected ? (
                <div className="text-blue-400 text-sm">
                  Connect Arweave wallet
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">Connected: {formatAddress(walletAddress)}</span>
                </div>
              )}
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1B1B1B' }}>
                <ArrowDown className="w-5 h-5 text-gray-300" />
              </div>
            </div>

            {/* You Receive Section */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#1B1B1B' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400 text-sm">You receive</span>
              </div>

              <div className="flex items-center justify-between mb-1">
                <div className="text-4xl font-light text-white">
                  {astroAmount}
                </div>
                <div className="flex items-center space-x-2 px-4 py-3 w-[120px]" style={{ backgroundColor: '#0F0F0F' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2563EB' }}>
                    <img src="https://whs6rte25q7uhibdjaxqe6x4zzt7dcdr3ptcjjjd3qgchre5njqq.arweave.net/seXozJrsP0OgI0gvAnr8zmfxiHHb5iSlI9wMI8SdamE" alt="" />
                  </div>
                  <span className="font-medium text-white">USDA</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{astroAmount} USD</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Balance: ~0 USDA</span>
                  <button className="text-blue-400 hover:text-blue-300 font-medium">MAX</button>
                </div>
              </div>
            </div>

            {/* Connect Arweave Wallet Button */}
            <button
              onClick={() => {
                connected ? swapTokens(wUSDCAmount) : handleConnectWallet()
              }}
              disabled={isLoading || !connected}
              className="w-full font-medium py-2 px-6 rounded-xl transition-colors duration-200 text-white"
              style={{
                backgroundColor: connected ? '#6366F1' : '#3F539F',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : 'Swap Tokens'}
            </button>
          </div>
        </div>

        {/* Order History */}
        <div className="rounded-xl p-6 border mt-5" style={{ backgroundColor: '#1B1B1B', borderColor: '#2A2A2A' }}>
          <h3 className="text-lg font-medium mb-4 text-white">Order History</h3>

          {myOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#0F0F0F' }}>
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg p-4 border transition-colors hover:border-gray-600"
                  style={{ backgroundColor: '#0F0F0F', borderColor: '#2A2A2A' }}
                >
                  {/* Order Item */}
                  <div className="flex items-center justify-between">
                    {/* Left side - Order ID with actions */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium text-sm">{order.id.slice(0,10)}...{order.id.slice(order.id.length-5,order.id.length)}</span>
                        <button
                          onClick={() => copyToClipboard(order.id, order.id)}
                          className="text-gray-400 hover:text-gray-300 transition-colors"
                          title="Copy Order ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleExternalLink(order.id)}
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                          title="View Order Details"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        {copiedId === order.id && (
                          <span className="text-green-400 text-xs">Copied!</span>
                        )}
                      </div>
                    </div>

                    {/* Center - Quantity */}
                    <div className="text-center flex items-center space-x-2">
                      <div className="text-white font-medium text-sm">
                        {formatTokenBalance(order.quantity, 6)} wUSDC
                      </div>
                      <div className="text-gray-400 text-xs">
                        → USDA
                      </div>
                    </div>

                    {/* Right side - Status */}
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.fulfilled)}`}>
                      {getStatusIcon(order.fulfilled)}
                      <span className="capitalize">{order.fulfilled}</span>
                    </div>
                  </div>

                  {/* Pending Status Info */}
                  {order.fulfilled === false && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: '#2A2A2A' }}>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>Processing... Expected completion within 24 hours</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Load More Button (if needed) */}
          {myOrders.length > 0 && (
            <div className="mt-4 text-center">
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                Load More Orders
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}