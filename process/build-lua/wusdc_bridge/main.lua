local _tl_compat; if (tonumber((_VERSION or ''):match('[%d.]*$')) or 0) < 5.3 then local p, m = pcall(require, 'compat53.module'); if p then _tl_compat = m end end; local ipairs = _tl_compat and _tl_compat.ipairs or ipairs; local math = _tl_compat and _tl_compat.math or math; local table = _tl_compat and _tl_compat.table or table
Order = {}





Message = {}








ASTRO_PROCESS_ID = "xRQPYNhFZgTi3VRSprtqtszCuF3_JFBw-bdgJG7aUsQ"
WUSDC_PROCESS_ID = "kUVaTPKz3qI-o4FblwxRXs1ZXSSobJDjVqxApHgt7fA"

orders = {}


local function convert_wusdc_to_usda(amount_wusdc)
   local DECIMALS_WUSDC = 6
   local DECIMALS_USDA = 12

   local scale_factor = 10 ^ (DECIMALS_USDA - DECIMALS_WUSDC)
   return math.floor(amount_wusdc * scale_factor + 0.5)
end

local function swapOrder(msg)

   if msg.From ~= WUSDC_PROCESS_ID then
      return
   end

   if not orders[msg.Sender] then
      orders[msg.Sender] = {}
   end


   local new_order = {
      id = msg.Id,
      quantity = msg.Tags.Quantity,
      fulfilled = false,
   }

   table.insert(orders[msg.Sender], new_order)

   ao.send({
      Target = msg.Sender,
      Action = "Order-Created",
      OrderId = msg.Id,
      Quantity = msg.Tags.Quantity,
      Fulfilled = "false",
   })


   local amount_usda = convert_wusdc_to_usda(tonumber(msg.Tags.Quantity))

   ao.send({
      Target = ASTRO_PROCESS_ID,
      Action = "Transfer",
      Recipient = msg.Sender,
      Quantity = tostring(amount_usda),
   })

   Receive({ Action = "Debit-Notice", Recipient = msg.Sender })


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
      Quantity = msg.Tags.Quantity,
   })
end

local function retrySwapOrder(msg)
   if not orders[msg.Sender] then
      return
   end

   for _, order in ipairs(orders[msg.Sender]) do
      if order.id == msg.Data and not order.fulfilled then
         local amount_usda = convert_wusdc_to_usda(tonumber(order.quantity))

         ao.send({
            Target = ASTRO_PROCESS_ID,
            Action = "Transfer",
            Recipient = msg.Sender,
            Quantity = tostring(amount_usda),
         })

         ao.send({
            Target = msg.Sender,
            Action = "Order-Fulfilled",
            OrderId = order.id,
            Quantity = order.quantity,
         })

         order.fulfilled = true
         break
      end
   end
end

local function withdrawOrder(msg)
   if not orders[msg.Sender] then
      return
   end

   for _, order in ipairs(orders[msg.Sender]) do
      if order.id == msg.Data and not order.fulfilled then
         ao.send({
            Target = WUSDC_PROCESS_ID,
            Action = "Transfer",
            Recipient = msg.Sender,
            Quantity = order.quantity,
         })

         Receive({ Action = "Debit-Notice", Recipient = msg.Sender })

         ao.send({
            Target = msg.Sender,
            Action = "Order-Withdrawn",
            OrderId = order.id,
            Quantity = order.quantity,
         })
         return
      end
   end

   ao.send({
      Target = msg.Sender,
      Action = "Order-Not-Found",
      Reason = "Order does not exist or has already been fulfilled.",
   })
end


Handlers.add('Credit-Notice', Handlers.utils.hasMatchingTag('Action', 'Credit-Notice'), swapOrder)
Handlers.add('Retry-Swap-Order', Handlers.utils.hasMatchingTag('Action', 'Retry-Swap-Order'), retrySwapOrder)
Handlers.add('Withdraw-Order', Handlers.utils.hasMatchingTag('Action', 'Withdraw-Order'), withdrawOrder)
