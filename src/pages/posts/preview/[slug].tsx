import { GetStaticPaths, GetStaticProps } from "next";
import Link from 'next/link';
import Head from "next/head";
import { RichText } from 'prismic-dom';
import styles from '../post.module.scss';
import { getPrismicClient } from "../../../services/prismic";
import { useSession } from "next-auth/client";
import { useRouter } from "next/router";
import { useEffect } from "react";

interface IPostPreview {
  postPreview: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  }
}

const Preview = ({ postPreview }: IPostPreview) => {
  const [session] = useSession();
  const { push } = useRouter();

  useEffect(() => {
    if (session?.activeSubscription) {
      push(`posts/${postPreview.slug}`);
    }
  }, [session, postPreview.slug, push]);

  return (
    <>
      <Head>
        <title>{postPreview.title} | Ignews</title>
      </Head>
      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{postPreview.title}</h1>
          <time>{postPreview.updatedAt}</time>
          <div 
            className={`${styles.postContent} ${styles.previewContent}`} 
            dangerouslySetInnerHTML={{ __html: postPreview.content }}/>
          <div className={styles.continueReading}>
            Wanna continue reading?
            <Link href='/'>
              <a>Suscribe now 🤗</a>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});
  const postPreview =  {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content.splice(0, 3)),
    updatedAt: new Date(response.last_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }
  return {
    props: { postPreview },
    revalidate: 60 * 30 // 30minuntes
  }
}

export default Preview;