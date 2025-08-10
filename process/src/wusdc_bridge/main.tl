local json = require("json")

-- Define types
global record Order
  id: string
  quantity: string
  fulfilled: boolean
end

global record Message
  Id: string
  From: string
  Sender: string
  Data: string
  Tags: {string:string}
end

-- Global variables
global ASTRO_PROCESS_ID: string = "FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8"
global WUSDC_PROCESS_ID: string = "7zH9dlMNoxprab9loshv3Y7WG45DOny_Vrq9KrXObdQ"

global orders: {string: {Order}}
orders = orders or {}


-- Generate random UUID
local function generate_uuid(): string
    local template: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    math.randomseed(os.time() + math.random(1000000)) -- better randomness
    local uuid: string = (string.gsub(template, "[xy]", function (c: string): string
        local v: integer
        if c == "x" then
            v = math.random(0, 15)
        else
            v = math.random(8, 11)
        end
        return string.format("%x", v)
    end))
    return uuid
end


-- Convert wUSDC to USDA (6 → 12 decimals)
local function convert_wusdc_to_usda(amount_wusdc: number): integer
    local DECIMALS_WUSDC: integer = 6
    local DECIMALS_USDA: integer = 12

    local scale_factor: number = 10 ^ (DECIMALS_USDA - DECIMALS_WUSDC)
    return math.floor(amount_wusdc * scale_factor + 0.5) -- rounds to nearest integer
end

local function swapOrder(msg: Message)
    -- Check if the message is from the correct process
    if msg.From ~= WUSDC_PROCESS_ID then
        return
    end

    if not orders[msg.Sender] then
        orders[msg.Sender] = {}
    end

    -- Order Creation
    local new_order: Order = {
        id = msg.Id,
        quantity = msg.Tags.Quantity,
        fulfilled = false
    }

    table.insert(orders[msg.Sender], new_order)

    ao.send({
        Target = msg.Sender,
        Action = "Order-Created",
        OrderId = msg.Id,
        Quantity = msg.Tags.Quantity,
        Fulfilled = "false"  -- Changed to string since ao.send expects strings
    })

    -- Order Fulfillment
    local amount_usda: integer = convert_wusdc_to_usda(tonumber(msg.Tags.Quantity))

    ao.send({
        Target=ASTRO_PROCESS_ID, 
        Quantity=tostring(amount_usda), 
        Recipient=msg.Sender, 
        Action="Mint", 
        ["X-Deposit-Id"]=generate_uuid(), 
        ["X-Token"]="AO", 
        ["X-Operation-Type"]="Mint", 
        ["X-Extra-Tag"]="nil", 
        ["X-Quantity"]=tostring(amount_usda), 
        ["X-Block-Height"]="20654321", 
        ["X-Owner"]=msg.Sender, 
        ["X-Destination"]=msg.Sender
    })

    Receive({ })

    -- Mark order as fulfilled
    for _, order in ipairs(orders[msg.Sender]) do
        if order.id == msg.Id then
            order.fulfilled = true
            break
        end
    end

    ao.send({
        Target = msg.Sender,
        Action = "Order-Fulfilled",
        OrderId = msg.Id,
        Quantity = msg.Tags.Quantity
    })
end

local function retrySwapOrder(msg: Message)
    if not orders[msg.Sender] then
        return
    end

    for _, order in ipairs(orders[msg.Sender]) do
        if order.id == msg.Data and not order.fulfilled then
            local amount_usda: integer = convert_wusdc_to_usda(tonumber(order.quantity))
            
            ao.send({
                Target = ASTRO_PROCESS_ID,
                Action = "Transfer",
                Recipient = msg.Sender,
                Quantity = tostring(amount_usda)
            })

            ao.send({
                Target = msg.Sender,
                Action = "Order-Fulfilled",
                OrderId = order.id,
                Quantity = order.quantity
            })

            order.fulfilled = true
            break
        end
    end
end

local function withdrawOrder(msg: Message)
    if not orders[msg.Sender] then
        return
    end

    for _, order in ipairs(orders[msg.Sender]) do
        if order.id == msg.Data and not order.fulfilled then

            ao.send({
                Target = WUSDC_PROCESS_ID,
                Action = "Transfer",
                Recipient = msg.Sender,
                Quantity = order.quantity
            })

            Receive({ Action = "Debit-Notice", Recipient = msg.Sender })
            ao.send({
                Target = msg.Sender,
                Action = "Order-Withdrawn",
                OrderId = order.id,
                Quantity = order.quantity
            })

            order.fulfilled = true
            
            return
        end
    end

    ao.send({
        Target = msg.Sender,
        Action = "Order-Not-Found",
        Reason = "Order does not exist or has already been fulfilled."
    })
end


local function fetchOrders(msg: Message)

    local requested_orders = orders[msg.Recipient]
    print(msg.Recipient)
    print(requested_orders)
    
    ao.send({
        Target = msg.From,
        Action = "Orders-Response",
        Data = json.encode(requested_orders) 
    })

end

-- Add handlers
Handlers.add('Credit-Notice', Handlers.utils.hasMatchingTag('Action', 'Credit-Notice'), swapOrder)
Handlers.add('Retry-Swap-Order', Handlers.utils.hasMatchingTag('Action', 'Retry-Swap-Order'), retrySwapOrder)
Handlers.add('Withdraw-Order', Handlers.utils.hasMatchingTag('Action', 'Withdraw-Order'), withdrawOrder)
Handlers.add('Fetch-Orders', Handlers.utils.hasMatchingTag('Action', 'Fetch-Orders'), fetchOrders)