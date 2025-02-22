import {
  SearchContext,
  SearchPagination,
  setRefinementAction,
  useNbHitsFromSearchResults,
} from '@edx/frontend-enterprise-catalog-search';
import {
  FormattedMessage,
  injectIntl,
  intlShape,
} from '@edx/frontend-platform/i18n';
import {
  Alert, Button, CardView, DataTable,
} from '@edx/paragon';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { connectStateResults } from 'react-instantsearch-dom';
import Skeleton from 'react-loading-skeleton';
import {
  CONTENT_TYPE_COURSE,
  CONTENT_TYPE_PROGRAM,
  CONTENT_TYPE_REFINEMENT,
  COURSE_TITLE,
  HIDE_PRICE_REFINEMENT,
  PROGRAM_TITLE,
} from '../../constants';
import {
  mapAlgoliaObjectToCourse,
  mapAlgoliaObjectToProgram,
} from '../../utils/algoliaUtils';
import CatalogInfoModal from '../catalogInfoModal/CatalogInfoModal';
import { useSelectedCourse } from '../catalogs/data/hooks';
import CourseCard from '../courseCard/CourseCard';
import ProgramCard from '../programCard/ProgramCard';
import CatalogBadges from './associatedComponents/catalogBadges/CatalogBadges';
import TitleButton from './associatedComponents/titleButton/TitleButton';
import DownloadCsvButton from './associatedComponents/downloadCsvButton/DownloadCsvButton';
import messages from './CatalogSearchResults.messages';

import CatalogNoResultsDeck from '../catalogNoResultsDeck/CatalogNoResultsDeck';
import { formatDate, makePlural } from '../../utils/common';

export const ERROR_MESSAGE = 'An error occured while retrieving data';

export const SKELETON_DATA_TESTID = 'enterprise-catalog-skeleton';

/**
 * The core search results rendering component.
 *
 * Wrapping this in `connectStateResults()` will inject the first few props.
 *
 * @param {object} args arguments
 * @param {object} args.searchResults Results of search (see: `connectStateResults``)
 * @param {Boolean} args.isSearchStalled Whether search is stalled (see: `connectStateResults`)
 * @param {object} args.searchState contents of search state, like `page` (see: `connectStateResults``)
 * @param {object} args.error Error with `message` field if available (see: `connectStateResults``)
 * @param {object} args.paginationComponent Defaults to <SearchPagination> but can be injected
 * @param {object} args.contentType Whether the search is for courses or programs
 * @param {object} args.preview Whether we are on the split screen landing page or regular
 */

export function BaseCatalogSearchResults({
  intl,
  searchResults,
  // algolia recommends this prop instead of searching
  isSearchStalled,
  searchState,
  error,
  paginationComponent: PaginationComponent,
  contentType,
  courseType,
  setNoCourses,
  setNoPrograms,
  preview,
}) {
  const isProgramType = contentType === CONTENT_TYPE_PROGRAM;
  const isCourseType = contentType === CONTENT_TYPE_COURSE;

  const TABLE_HEADERS = useMemo(
    () => ({
      courseName: intl.formatMessage(
        messages['catalogSearchResults.table.courseName'],
      ),
      partner: intl.formatMessage(
        messages['catalogSearchResults.table.partner'],
      ),
      price: intl.formatMessage(messages['catalogSearchResults.table.price']),
      availability: intl.formatMessage(
        messages['catalogSearchResults.table.availability'],
      ),
      catalogs: intl.formatMessage(
        messages['catalogSearchResults.table.catalogs'],
      ),
      programName: intl.formatMessage(
        messages['catalogSearchResults.table.programName'],
      ),
      numCourses: intl.formatMessage(
        messages['catalogSearchResults.table.numCourses'],
      ),
      programType: intl.formatMessage(
        messages['catalogSearchResults.table.programType'],
      ),
    }),
    [intl],
  );

  const { refinements, dispatch } = useContext(SearchContext);
  const nbHits = useNbHitsFromSearchResults(searchResults);
  const linkText = `Show (${nbHits}) >`;

  const [selectedCourse, setSelectedCourse, isProgram, isCourse] = useSelectedCourse();

  const [cardView, setCardView] = useState(true);

  const rowClicked = useCallback(
    (row) => {
      if (isProgramType) {
        setSelectedCourse(mapAlgoliaObjectToProgram(row.original));
      } else {
        setSelectedCourse(
          mapAlgoliaObjectToCourse(row.original, intl, messages),
        );
      }
    },
    [intl, isProgramType, setSelectedCourse],
  );

  const cardClicked = useCallback(
    (card) => {
      if (isProgramType) {
        setSelectedCourse(mapAlgoliaObjectToProgram(card));
      } else {
        setSelectedCourse(mapAlgoliaObjectToCourse(card, intl, messages));
      }
    },
    [intl, isProgramType, setSelectedCourse],
  );

  const refinementClick = (content) => {
    if (content === CONTENT_TYPE_COURSE) {
      dispatch(
        setRefinementAction(CONTENT_TYPE_REFINEMENT, [CONTENT_TYPE_COURSE]),
      );
    } else {
      dispatch(
        setRefinementAction(CONTENT_TYPE_REFINEMENT, [CONTENT_TYPE_PROGRAM]),
      );
    }
  };

  const renderCardComponent = (props) => {
    if (isCourseType) {
      return <CourseCard {...props} onClick={cardClicked} />;
    }
    return <ProgramCard {...props} onClick={cardClicked} />;
  };

  const availabilityColumn = {
    id: 'availability-column',
    Header: TABLE_HEADERS.availability,
    accessor: 'advertised_course_run',
    Cell: ({ row }) => formatDate(row.values.advertised_course_run),
  };

  const TitleButtonComponent = useCallback(
    ({ row }) => <TitleButton row={row} onClick={rowClicked} />,
    [rowClicked],
  );

  const CatalogBadgeComponent = useCallback(
    ({ row }) => <CatalogBadges row={row} />,
    [],
  );

  // NOTE: Cell is not explicity supported in DataTable, which leads to lint errors regarding {row}. However, we needed
  // to use the accessor functionality instead of just adding in additionalColumns like the Paragon documentation.
  const courseColumns = useMemo(
    () => [
      {
        Header: TABLE_HEADERS.courseName,
        accessor: 'title',
        Cell: TitleButtonComponent,
      },
      {
        Header: TABLE_HEADERS.partner,
        accessor: 'partners[0].name',
      },
      {
        Header: TABLE_HEADERS.price,
        accessor: 'first_enrollable_paid_seat_price',
        Cell: ({ row }) => (row.values.first_enrollable_paid_seat_price
          ? `$${row.values.first_enrollable_paid_seat_price}`
          : null),
      },
      {
        Header: TABLE_HEADERS.catalogs,
        accessor: 'enterprise_catalog_query_titles',
        Cell: CatalogBadgeComponent,
      },
    ],
    [TABLE_HEADERS, TitleButtonComponent, CatalogBadgeComponent],
  );

  const programColumns = useMemo(
    () => [
      {
        Header: TABLE_HEADERS.programName,
        accessor: 'title',
        Cell: TitleButtonComponent,
      },
      {
        Header: TABLE_HEADERS.partner,
        accessor: 'authoring_organizations[0].name',
      },
      {
        Header: TABLE_HEADERS.numCourses,
        accessor: 'course_keys',
        Cell: ({ row }) => (row.values.course_keys.length > 0
          ? `${row.values.course_keys.length}`
          : 'Available upon request'),
      },
      {
        Header: TABLE_HEADERS.programType,
        accessor: 'program_type',
      },

      {
        Header: TABLE_HEADERS.catalogs,
        accessor: 'enterprise_catalog_query_titles',
        Cell: CatalogBadgeComponent,
      },
    ],
    [TABLE_HEADERS, TitleButtonComponent, CatalogBadgeComponent],
  );

  // substituting the price column with the availability dates per customer request ENT-5041
  const page = refinements.page || (searchState ? searchState.page : 0);
  if (HIDE_PRICE_REFINEMENT in refinements) {
    courseColumns[2] = availabilityColumn;
  }
  const tableData = useMemo(
    () => searchResults?.hits || [],
    [searchResults?.hits],
  );
  const query = queryString.parse(window.location.search.substring(1));
  const toggleOptions = preview
    ? {}
    : {
      isDataViewToggleEnabled: true,
      onDataViewToggle: (val) => setCardView(val === 'card'),
      togglePlacement: 'left',
      defaultActiveStateValue: 'card',
    };

  function contentTitle() {
    let subTitle = contentType === CONTENT_TYPE_COURSE ? COURSE_TITLE : PROGRAM_TITLE;
    if (refinements.q && refinements.q !== '') {
      subTitle = `"${refinements.q}" ${subTitle} (${makePlural(
        nbHits,
        'result',
      )})`;
    }
    return subTitle;
  }

  useEffect(() => {
    if (contentType === CONTENT_TYPE_COURSE) {
      if (searchResults?.nbHits === 0) {
        setNoCourses(true);
      } else {
        setNoCourses(false);
      }
    } else if (searchResults?.nbHits === 0) {
      setNoPrograms(true);
    } else {
      setNoPrograms(false);
    }
  });
  const inputQuery = query.q;

  const dataTableActions = () => {
    if (preview || searchResults?.nbHits === 0) {
      return null;
    }

    return (
      <DownloadCsvButton
        // eslint-disable-next-line no-underscore-dangle
        facets={searchResults?._state.disjunctiveFacetsRefinements}
        query={inputQuery}
      />
    );
  };

  if (isSearchStalled) {
    return (
      <div data-testid={SKELETON_DATA_TESTID}>
        <Skeleton className="m-1 loading-skeleton" height={25} count={5} />
      </div>
    );
  }
  if (error) {
    return (
      <Alert className="mt-2" variant="warning">
        <FormattedMessage
          id="catalogs.catalogSearchResults.error"
          defaultMessage="{message}: {fullError}"
          description="Error message displayed when results cannot be returned."
          values={{ message: ERROR_MESSAGE, fullError: error.message }}
        />
      </Alert>
    );
  }

  return (
    <>
      {isCourseType && (
        <CatalogInfoModal
          isOpen={isCourse}
          onClose={() => setSelectedCourse(null)}
          selectedCourse={selectedCourse}
        />
      )}
      {isProgramType && (
        <CatalogInfoModal
          isOpen={isProgram}
          onClose={() => setSelectedCourse(null)}
          selectedProgram={selectedCourse}
          renderProgram
        />
      )}
      {preview && isCourseType && searchResults?.nbHits !== 0 && (
        <span className="landing-page-download">
          <DownloadCsvButton
            // eslint-disable-next-line no-underscore-dangle
            facets={searchResults?._state.disjunctiveFacetsRefinements}
            query={inputQuery}
          />
        </span>
      )}
      <div className="clearfix" />
      {preview && (
        <div className="preview-title">
          <p className="h2 mt-4">{contentTitle()}</p>
          {searchResults?.nbHits !== 0 && (
            <Button variant="link" onClick={() => refinementClick(contentType)}>
              {linkText}
            </Button>
          )}
        </div>
      )}
      {searchResults?.nbHits === 0 && (
        <CatalogNoResultsDeck
          setCardView={setCardView}
          columns={
            contentType === CONTENT_TYPE_COURSE ? courseColumns : programColumns
          }
          renderCardComponent={renderCardComponent}
          contentType={contentType}
          courseType={courseType}
        />
      )}
      {searchResults?.nbHits !== 0 && (
        <DataTable
          isSortable
          dataViewToggleOptions={toggleOptions}
          columns={isCourseType ? courseColumns : programColumns}
          data={tableData}
          itemCount={searchResults?.nbHits || 0}
          pageCount={searchResults?.nbPages || 1}
          pageSize={searchResults?.hitsPerPage || 0}
          tableActions={dataTableActions}
        >
          <DataTable.TableControlBar />
          {cardView && (
            <CardView
              columnSizes={{
                xs: 12,
                sm: 6,
                md: 4,
                lg: 4,
                xl: 3,
              }}
              CardComponent={(props) => renderCardComponent(props)}
            />
          )}
          {!cardView && <DataTable.Table />}

          {!preview && (
            <DataTable.TableFooter>
              <DataTable.RowStatus />
              <PaginationComponent defaultRefinement={page} />
            </DataTable.TableFooter>
          )}
        </DataTable>
      )}
    </>
  );
}

BaseCatalogSearchResults.defaultProps = {
  searchResults: { disjunctiveFacetsRefinements: [], nbHits: 0, hits: [] },
  error: null,
  paginationComponent: SearchPagination,
  row: null,
  preview: false,
  setNoCourses: () => {},
  setNoPrograms: () => {},
  courseType: null,
};

BaseCatalogSearchResults.propTypes = {
  intl: intlShape.isRequired,
  // from Algolia
  searchResults: PropTypes.shape({
    _state: PropTypes.shape({
      disjunctiveFacetsRefinements: PropTypes.shape({}),
    }),
    disjunctiveFacetsRefinements: PropTypes.arrayOf(PropTypes.shape({})),
    nbHits: PropTypes.number,
    hits: PropTypes.arrayOf(PropTypes.shape({})),
    nbPages: PropTypes.number,
    hitsPerPage: PropTypes.number,
    page: PropTypes.number,
  }),
  isSearchStalled: PropTypes.bool.isRequired,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),

  searchState: PropTypes.shape({
    page: PropTypes.number,
  }).isRequired,
  paginationComponent: PropTypes.func,
  // eslint-disable-next-line react/no-unused-prop-types
  row: PropTypes.string,
  contentType: PropTypes.string.isRequired,
  courseType: PropTypes.string,
  preview: PropTypes.bool,
  setNoCourses: PropTypes.func,
  setNoPrograms: PropTypes.func,
};

export default connectStateResults(injectIntl(BaseCatalogSearchResults));
