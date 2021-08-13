import Stripe from 'stripe';
import { Fauna, fauna } from './fauna';
import { version } from '../../package.json';

class CustomStripe {
  private stripe: Stripe;
  private repository: Fauna;

  constructor(repository: Fauna) {
    this.repository = repository;
    this.stripe = new Stripe(
      process.env.STRIPE_API_KEY,
      {
        apiVersion: '2020-08-27',
        appInfo: {
          name: 'Ignews',
          version
        }
      }
    );
  }

  public async saveSubscription (stripeEvent: Stripe.Event, createAction=false) {
    let checkoutSession;
    if (createAction) {
      checkoutSession = stripeEvent.data.object as Stripe.Checkout.Session 
    } else {
      checkoutSession = stripeEvent.data.object as Stripe.Subscription 
    }
    const user = await this.repository.getUserByStripeCustomerId(checkoutSession.customer.toString());
    const subscription = await this.retrieveSubscriptionById(
      checkoutSession.subscription ? checkoutSession.subscription.toString() : checkoutSession.id
    );
    const formatedSubscription = {
      id: subscription.id,
      user_id: user.ref,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
    };
    createAction ? await this.repository.saveSubscription(formatedSubscription): await this.repository.udpateSubscription(formatedSubscription);
  }

  private async retrieveSubscriptionById(id: string): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(id);
    return subscription
  }

  public getEvent(buffer: Buffer, secret: string | Array<string>): Stripe.Event {
    const event = this.stripe.webhooks.constructEvent(buffer, secret, process.env.STRIPE_WEBHOOK_KEY);
    return event;
  }

  public async retrieveAmount(): Promise<Stripe.Price> {
    const price = await this.stripe.prices.retrieve(process.env.PRICE_KEY);
    return price;
  }

  public async createCheckoutByEmail(email: string): Promise<Stripe.Checkout.Session> {
    const stripe_customer_id = await this.getStripeCustomer(email);
    const checkoutSession = await this.createCheckoutByStripeId(stripe_customer_id);
    return checkoutSession;
  }

  private async getStripeCustomer(email: string): Promise<string> {
    const user = await this.repository.getUserByEmail(email);
    let customer_id = user.data.stripe_customer_id;
    if (!customer_id) {
      const stripeCustomer = await this.stripe.customers.create({
        email,
      });
      customer_id = stripeCustomer.id
      await this.repository.udpateUser(user.ref.id, customer_id);
    }
    return customer_id
  }

  private async createCheckoutByStripeId(id: string): Promise<Stripe.Checkout.Session> {
    const checkoutSession = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        { price: process.env.PRICE_KEY, quantity: 1 }
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_ERROR_URL,
      customer: id
    });
    return checkoutSession;
  }
}

const stripe = new CustomStripe(fauna);

export { stripe };