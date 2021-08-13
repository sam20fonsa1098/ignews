import { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';
import { stripe } from '../../../services/stripe';

async function handleBuffer(readable: Readable) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false
  }
}

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

const createdEvents = new Set([
  'checkout.session.completed',
]);

const webhooks = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method === 'POST') {
    const buffer = await handleBuffer(request);
    const secret = request.headers['stripe-signature'];
    try {
      const event = stripe.getEvent(buffer, secret)
      if (relevantEvents.has(event.type)) {
        await stripe.saveSubscription(event, createdEvents.has(event.type));
      }
    } catch(err) {
      console.log(err);
      return response.status(400).send(`Webhook error: ${err.message}`)
    }
    return response.status(200).json({received: true});
  }
  response.setHeader('Allow', 'POST');
  return response.status(405).end('Method not allowed');
}

export default webhooks;