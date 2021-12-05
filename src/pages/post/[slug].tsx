import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';

import { RichText } from 'prismic-dom';

import parseISO from 'date-fns/parseISO';
import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  const wordCount = post.data.content.reduce((acc, content) => {
    if (!content || !content.body) return acc;
    const bodyWordCount = RichText.asText(content.body).split(
      /\b[^\s]+\b/
    ).length;
    const headingWordCount = content?.heading
      ? content?.heading.split(/\b[^\s]+\b/).length
      : 0;
    return acc + bodyWordCount + headingWordCount;
  }, 0);

  const minutesToRead = Math.ceil(wordCount / 200);

  return (
    <>
      <Header />
      <img
        className={styles.banner}
        src={post?.data?.banner.url || '/images/banner.jpg'}
        alt="banner"
      />
      <main className={commonStyles.mainContainer}>
        <div className={styles.postContainer}>
          <h1>{post.data.title}</h1>
        </div>
        <div className={styles.postInformation}>
          <span>
            <FiCalendar />
            <time>
              {format(parseISO(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
          </span>
          <span>
            <FiUser />
            {post.data.author}
          </span>
          <span>
            <FiClock />
            {minutesToRead} min
          </span>
        </div>
        {post.data.content.map(content => (
          <div key={content.heading} className={styles.postContent}>
            <h2>{content.heading}</h2>
            {content.body.map(body => (
              <p key={body.text}>{body.text}</p>
            ))}
          </div>
        ))}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    { pageSize: 2 }
  );

  return {
    paths: response.results.map(post => ({
      params: {
        slug: post.uid,
      },
    })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
  };
};
