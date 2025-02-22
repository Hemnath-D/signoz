import { Typography } from 'antd';
import getByErrorType from 'api/errors/getByErrorTypeAndService';
import getById from 'api/errors/getById';
import Spinner from 'components/Spinner';
import ROUTES from 'constants/routes';
import ErrorDetailsContainer from 'container/ErrorDetails';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { Redirect, useLocation } from 'react-router-dom';
import { AppState } from 'store/reducers';
import { PayloadProps } from 'types/api/errors/getById';
import { GlobalReducer } from 'types/reducer/globalTime';

function ErrorDetails(): JSX.Element {
	const { t } = useTranslation(['common']);
	const { maxTime, minTime } = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);
	const { search } = useLocation();
	const params = new URLSearchParams(search);

	const errorId = params.get('errorId');
	const errorType = params.get('errorType');
	const serviceName = params.get('serviceName');
	const defaultError = t('something_went_wrong');

	const { data, status } = useQuery(
		[
			'errorByType',
			errorType,
			'serviceName',
			serviceName,
			maxTime,
			minTime,
			errorId,
		],
		{
			queryFn: () =>
				getByErrorType({
					end: maxTime,
					errorType: errorType || '',
					serviceName: serviceName || '',
					start: minTime,
				}),
			enabled: errorId === null && errorType !== null && serviceName !== null,
			cacheTime: 5000,
		},
	);

	const { status: ErrorIdStatus, data: errorIdPayload } = useQuery(
		[
			'errorByType',
			errorType,
			'serviceName',
			serviceName,
			maxTime,
			minTime,
			'errorId',
			errorId,
		],
		{
			queryFn: () =>
				getById({
					end: maxTime,
					errorId: errorId || data?.payload?.errorId || '',
					start: minTime,
				}),
			enabled:
				(errorId !== null || status === 'success') &&
				errorType !== null &&
				serviceName !== null,
			cacheTime: 5000,
		},
	);

	// if errorType and serviceName is null redirecting to the ALL_ERROR page not now
	if (errorType === null || serviceName === null) {
		return <Redirect to={ROUTES.ALL_ERROR} />;
	}

	// when the api is in loading state
	if (status === 'loading' || ErrorIdStatus === 'loading') {
		return <Spinner tip="Loading.." />;
	}

	// if any error occurred while loading
	if (status === 'error' || ErrorIdStatus === 'error') {
		return (
			<Typography>
				{data?.error || errorIdPayload?.error || defaultError}
			</Typography>
		);
	}

	// if API is successfully but there is an error
	if (
		(status === 'success' && data?.statusCode >= 400) ||
		(ErrorIdStatus === 'success' && errorIdPayload.statusCode >= 400)
	) {
		return <Typography>{data?.error || defaultError}</Typography>;
	}

	return (
		<ErrorDetailsContainer idPayload={errorIdPayload?.payload as PayloadProps} />
	);
}

export interface ErrorDetailsParams {
	errorType: string;
	serviceName: string;
}

export default ErrorDetails;
