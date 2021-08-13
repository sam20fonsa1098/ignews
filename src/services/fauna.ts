import { Client, query } from 'faunadb';

interface IUser {
  ref: {
    id: string;
  };
  data: {
    email: string;
    stripe_customer_id: string | undefined;
  }
}

interface ISubscription {
  ref: {
    id: string;
  }
  data: {
    price_id: string;
    status: string;
    id: string;
  }
}

class Fauna {
  private fauna : Client

  constructor() {
    this.fauna = new Client({
      secret: process.env.FAUNA_DB_KEY
    });
  }

  public async getUserByEmail(email: string): Promise<IUser> {
    const user = await this.fauna.query<IUser>(
      query.Get(
        query.Match(
          query.Index('user_by_email'),
          query.Casefold(email)
        )
      )
    )
    return user;
  }

  public async getUserByStripeCustomerId(stripe_customer_id: string): Promise<IUser>  {
    const user = await this.fauna.query<IUser>(
      query.Get(
        query.Match(
          query.Index('user_by_stripe_customer_id'),
          stripe_customer_id
        )
      )
    )
    return user;
  }

  public async getSubcriptionByEmail(email: string): Promise<ISubscription> {
    const subscription = await this.fauna.query<ISubscription>(
      query.Get(
        query.Intersection([
          query.Match(
            query.Index('subscription_by_user_ref'),
            query.Select(
              "ref",
              query.Get(
                query.Match(
                  query.Index('user_by_email'),
                  query.Casefold(email)
                )
              )
            )
          ),
          query.Match(
            query.Index('subscription_by_status'),
            'active'
          ),
        ])
      )
    )
    return subscription;
  }

  public async udpateUser(id: string, stripe_customer_id: string) {
    await this.fauna.query(
      query.Update(
        query.Ref(
          query.Collection('users'), id 
        ),
        {
          data: {
            stripe_customer_id,
          }
        }
      )
    )
  }

  public async saveUserWithEmail(email: string) {
    await this.fauna.query(
      query.If(
        query.Not(
          query.Exists(
            query.Match(
              query.Index('user_by_email'),
              query.Casefold(email)
            )
          )
        ),
        query.Create(
          query.Collection('users'),
          { data: { email } }
        ),
        query.Get(
          query.Match(
            query.Index('user_by_email'),
            query.Casefold(email)
          )
        )
      )
    )
  }

  public async saveSubscription(subscription) {
    await this.fauna.query(
      query.Create(
        query.Collection('subscriptions'),
        { data: subscription }
      )
    )
  }

  public async udpateSubscription(subscription) {
    await this.fauna.query(
      query.Replace(
        query.Select(
          "ref",
          query.Get(
            query.Match(
              query.Index('subscription_by_id'),
              subscription.id
            )
          )
        ),
        { data: subscription }
      )
    )
  }
}

const fauna = new Fauna();

export { fauna, Fauna };