import { Api } from '@jellyfin/sdk';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { useQuery } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';
import { QUERY_OPTIONS } from '../constants/queryOptions';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemsApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/items-api';

const fetchPeople = async (
    api: Api,
    userId: string,
    params?: ItemsApiGetItemsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getItemsApi(api).getItems(
        {
            ...QUERY_OPTIONS,
            userId: userId,
            recursive: true,
            mediaTypes: [MediaType.Video],
            excludeItemTypes: [
                BaseItemKind.Movie,
                BaseItemKind.Episode,
                BaseItemKind.TvChannel
            ],
            ...params
        },
        options
    );
    return response.data;
};

export const useVideoSearch = (
    parentId?: string,
    collectionType?: CollectionType,
    searchTerm?: string
) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    return useQuery({
        queryKey: ['VideoSearch', collectionType, parentId, searchTerm],
        queryFn: async ({ signal }) => {
            const videosData = await fetchPeople(
                api!,
                userId!,
                {
                    parentId: parentId,
                    searchTerm: searchTerm
                },
                { signal }
            );

            return videosData;
        },
        enabled: !!api && !!userId && !collectionType
    });
};
