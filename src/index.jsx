import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR,
  APP_READY,
  subscribe,
  initialize,
  mergeConfig,
} from '@edx/frontend-platform';
import { ErrorPage } from '@edx/frontend-platform/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { messages as paragonMessages } from '@edx/paragon';
import { messages as headerMessages } from '@edx/frontend-component-header';
import { messages as footerMessages } from '@edx/frontend-component-footer';

import App from './components/app/App';

import appMessages from './i18n';

import './index.scss';

subscribe(APP_READY, () => {
  ReactDOM.render(<App />, document.getElementById('root'));
});

subscribe(APP_INIT_ERROR, (error) => {
  ReactDOM.render(
    <ErrorPage message={error.message} />,
    document.getElementById('root'),
  );
});

initialize({
  handlers: {
    config: () => {
      mergeConfig({
        ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID || null,
        ALGOLIA_SEARCH_API_KEY: process.env.ALGOLIA_SEARCH_API_KEY || null,
        ALGOLIA_INDEX_NAME: process.env.ALGOLIA_INDEX_NAME || null,
        HUBSPOT_MARKETING_URL: process.env.HUBSPOT_MARKETING_URL || null,
        EDX_FOR_BUSINESS_TITLE: process.env.EDX_FOR_BUSINESS_TITLE || null,
        EDX_FOR_ONLINE_EDU_TITLE: process.env.EDX_FOR_ONLINE_EDU_TITLE || null,
        EDX_ENTERPRISE_ALACARTE_TITLE:
          process.env.EDX_ENTERPRISE_ALACARTE_TITLE || null,
        FEATURE_CARD_VIEW_ENABLED:
          process.env.FEATURE_CARD_VIEW_ENABLED || false,
        FEATURE_PROGRAM_TYPE_FACET:
          process.env.FEATURE_PROGRAM_TYPE_FACET || false,
      });
    },
    auth: () => {},
  },
  messages: [appMessages, headerMessages, footerMessages, paragonMessages],
});
