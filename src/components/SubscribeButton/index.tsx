import { signIn, useSession } from 'next-auth/client';
import router, { useRouter } from 'next/router';
import { useCallback } from 'react';
import { getStripeJs } from '../../services/stripe-js';
import { api } from '../../services/api';
import { ISubscribeButtonProps } from './interfaces';
import styles from './styles.module.scss';


const SubscribeButton = ({ price_id }: ISubscribeButtonProps) => {
  const [session] = useSession();
  const { push } = useRouter();

  const handleSubsribe = useCallback(async () => {
    if (!session) {
      signIn('github');
      return;
    }
    if (session.activeSubscription) {
      router.push('/posts');
      return ;
    }
    try {
      const response = await api.post('/subscribe');
      const { session_id } = response.data;
      const stripeJs = await getStripeJs();
      await stripeJs.redirectToCheckout({ sessionId: session_id });
    } catch(err) {
      alert(err.message);
    }
  }, [session]);

  return (
    <button type="button" className={styles.subscribeButton} onClick={handleSubsribe}>
      Subscribe now
    </button>
  );
}

export { SubscribeButton };