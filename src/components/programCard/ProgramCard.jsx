/* eslint-disable camelcase */
// variables taken from algolia not in camelcase
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Badge, Icon, Card } from '@edx/paragon';
import { Program } from '@edx/paragon/icons';

import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import messages from './ProgramCard.messages';
import { getCourses } from '../../utils/common';
import defaultCardHeader from '../../static/default-card-header-dark.png';

function ProgramCard({ intl, onClick, original }) {
  const {
    title,
    card_image_url,
    course_keys,
    enterprise_catalog_query_titles,
    authoring_organizations,
    program_type,
  } = original;

  const alaCarteRequested = enterprise_catalog_query_titles?.includes(
    process.env.EDX_ENTERPRISE_ALACARTE_TITLE,
  );
  const businessCatalogRequested = enterprise_catalog_query_titles?.includes(
    process.env.EDX_FOR_BUSINESS_TITLE,
  );
  const eduCatalogRequested = enterprise_catalog_query_titles?.includes(
    process.env.EDX_FOR_ONLINE_EDU_TITLE,
  );
  const imageSrc = card_image_url || defaultCardHeader;

  return (
    <Card
      isClickable
      className="program-card"
      tabIndex="0"
      onClick={() => onClick(original)}
    >
      <Card.ImageCap
        src={imageSrc}
        logoSrc={authoring_organizations[0]?.logo_image_url}
        srcAlt={title}
        logoAlt={authoring_organizations[0]?.name}
      />
      <Card.Header
        title={title}
        subtitle={
          authoring_organizations.length !== 0 && (
            <p className="small">{authoring_organizations[0].name}</p>
          )
        }
      />
      <Card.Section className={classNames('flex-column justify-content-end')}>
        <span className="d-block">
          <Badge
            variant="light"
            className={classNames('program d-inline-flex mb-2')}
          >
            <Icon src={Program} className="badge-icon" />
            <span className="badge-text"> {program_type} </span>
          </Badge>
        </span>
        <p className="x-small mb-2 mt-2">
          {getCourses(course_keys.length, 'Course')}
        </p>
        <div style={{ maxWidth: '400vw' }}>
          {alaCarteRequested && (
            <Badge variant="info" className="ml-0 bright padded-catalog">
              {intl.formatMessage(messages['ProgramCard.aLaCarteBadge'])}
            </Badge>
          )}
          {businessCatalogRequested && (
            <Badge variant="secondary" className="padded-catalog">
              {intl.formatMessage(messages['ProgramCard.businessBadge'])}
            </Badge>
          )}
          {eduCatalogRequested && (
            <Badge className="padded-catalog" variant="light">
              {intl.formatMessage(messages['ProgramCard.educationBadge'])}
            </Badge>
          )}
        </div>
      </Card.Section>
    </Card>
  );
}

ProgramCard.defaultProps = {
  onClick: () => {},
};

ProgramCard.propTypes = {
  intl: intlShape.isRequired,
  onClick: PropTypes.func,
  original: PropTypes.shape({
    title: PropTypes.string,
    card_image_url: PropTypes.string,
    course_keys: PropTypes.arrayOf(PropTypes.string),
    authoring_organizations: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        logo_image_url: PropTypes.string,
      }),
    ),
    enterprise_catalog_query_titles: PropTypes.arrayOf(PropTypes.string),
    program_type: PropTypes.string,
  }).isRequired,
};

export default injectIntl(ProgramCard);
