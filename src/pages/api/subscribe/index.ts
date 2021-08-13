import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/client';
import { stripe } from '../../../services/stripe';

const subsribe = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method === "POST") {
    const session = await getSession({ req: request });
    const checkoutSession = await stripe.createCheckoutByEmail(session.user.email);
    return response.status(200).json({ session_id: checkoutSession.id });
  } 
  response.setHeader('Allow', 'POST');
  return response.status(405).end('Method not allowed');
}

export default subsribe;