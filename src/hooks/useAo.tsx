import { connect, createDataItemSigner } from "@permaweb/aoconnect";
import { formatTokenBalance, unformatTokenBalance } from "../utils";
import { useToast } from "./useToast";

function useAo() {

    const { result, results, message, spawn, monitor, unmonitor, dryrun } = connect({ MODE: "legacy", CU_URL: "https://cu.ao-testnet.xyz" });
    const toast = useToast();


    const getwUSDCBalance = async (address: string): Promise<string> => {
        const result = await dryrun({
            process: import.meta.env.VITE_WUSDC_PROCESS_ID,
            tags: [
                { name: 'Action', value: 'Balance' },
                { name: 'Recipient', value: address }
            ],
        });
        const balance = result.Messages[0].Data as string;
        return formatTokenBalance(balance, 6);
    }

    const getUSDABalance = async (address: string): Promise<string> => {
        const result = await dryrun({
            process: import.meta.env.VITE_ASTRO_PROCESS_ID,
            tags: [
                { name: 'Action', value: 'Balance' },
                { name: 'Recipient', value: address }
            ],
        });
        const balance = result.Messages[0].Data as string;
        return formatTokenBalance(balance, 12);
    }

    const swapTokens = async (wUSDCAmount: string) => {
        await message({ 
            process: import.meta.env.VITE_WUSDC_PROCESS_ID,
            tags: [
                { name: 'Action', value: 'Transfer' },
                { name: 'Recipient', value: import.meta.env.VITE_COMET_PROCESS_ID },
                { name: 'Quantity', value: unformatTokenBalance(wUSDCAmount, 6) },
            ],
            signer: createDataItemSigner(window.arweaveWallet)
        })

        toast.showTxSent()
    }

    const fetchOrders = async (address: string) => {

        try {
            const result = await dryrun({
                process: import.meta.env.VITE_COMET_PROCESS_ID,
                tags: [
                    { name: 'Action', value: 'Fetch-Orders' },
                    { name: 'Recipient', value: address }
                ],
            });
            if (!result || !result.Messages || result.Messages.length === 0) {
                console.log("No orders found for address:", address);
                return null;
            }
            
            const orders = result.Messages[0].Data as string;
            return (JSON.parse(orders) as []).reverse();

        } catch (error) {
            console.log("Error fetching orders:", error);
            return null;
        }

    }


    return {
        result,
        results,
        message,
        spawn,
        monitor,
        unmonitor,
        dryrun,
        getwUSDCBalance,
        swapTokens,
        fetchOrders,
        getUSDABalance
    };
}


export default useAo;