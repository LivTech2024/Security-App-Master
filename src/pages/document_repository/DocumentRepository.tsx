import { useEffect, useState } from 'react'
import Button from '../../common/button/Button'
import { useAuthState, useEditFormStore } from '../../store'
import { useDebouncedValue } from '@mantine/hooks'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  DisplayCount,
  MinimumQueryCharacter,
  REACT_QUERY_KEYS,
} from '../../@types/enum'
import DbCompany from '../../firebase_configs/DB/DbCompany'
import { DocumentData } from 'firebase/firestore'
import {
  IDocumentCategories,
  IDocumentsCollection,
} from '../../@types/database'
import { useInView } from 'react-intersection-observer'
import NoSearchResult from '../../common/NoSearchResult'
import TableShimmer from '../../common/shimmer/TableShimmer'
import { formatDate } from '../../utilities/misc'
import SearchBar from '../../common/inputs/SearchBar'
import DocumentCategoriesModal from '../../component/document_repository/modal/DocumentCategoriesModal'
import InputSelect from '../../common/inputs/InputSelect'
import AddDocumentModal from '../../component/document_repository/modal/AddDocumentModal'
import { IDocument } from '../../store/slice/editForm.slice'

const DocumentRepository = () => {
  const { company } = useAuthState()

  const { setDocumentEditData } = useEditFormStore()

  const [query, setQuery] = useState('')

  const [debouncedQuery] = useDebouncedValue(query, 200)

  const [categoryId, setCategoryId] = useState('')

  const {
    data: snapshotData,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: [
      REACT_QUERY_KEYS.DOCUMENT_LIST,
      debouncedQuery,
      company!.CompanyId,
      categoryId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbCompany.getDocuments({
        lmt: DisplayCount.DOCUMENT_LIST,
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
        cmpId: company!.CompanyId,
      })
      return snapshot.docs
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null
      }
      if (lastPage?.length === DisplayCount.DOCUMENT_LIST) {
        return lastPage.at(-1)
      }
      return null
    },
    initialPageParam: null as null | DocumentData,
    enabled:
      debouncedQuery.trim().length > 0 &&
      debouncedQuery.trim().length < MinimumQueryCharacter.DOCUMENT
        ? false
        : true,
  })

  const [data, setData] = useState<IDocumentsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IDocumentsCollection)
      )
    }
    return []
  })

  useEffect(() => {
    console.log(error, 'error')
  }, [error])

  // we are looping through the snapshot returned by react-query and converting them to data
  useEffect(() => {
    if (snapshotData) {
      const docData: IDocumentsCollection[] = []
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IDocumentsCollection
          docData.push(data)
        })
      })
      setData(docData)
    }
  }, [snapshotData])

  // hook for pagination
  const { ref, inView } = useInView()

  // this is for pagination
  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }, [fetchNextPage, inView, hasNextPage, isFetching])

  //* Fetch document categories
  const { data: categoriesSnapshot, isLoading: isCategoriesLoading } = useQuery(
    {
      queryKey: [REACT_QUERY_KEYS.DOCUMENT_CATEGORIES, company!.CompanyId],
      queryFn: async () => {
        const snapshot = await DbCompany.getDocumentCategories(
          company!.CompanyId
        )
        return snapshot.docs
      },
    }
  )

  const [categories, setCategories] = useState<IDocumentCategories[]>(() => {
    if (categoriesSnapshot) {
      return categoriesSnapshot.map((doc) => doc.data() as IDocumentCategories)
    }
    return []
  })

  useEffect(() => {
    if (categoriesSnapshot) {
      const docData = categoriesSnapshot.map(
        (doc) => doc.data() as IDocumentCategories
      )
      setCategories(docData)
    }
  }, [categoriesSnapshot])

  const [documentCategoriesModal, setDocumentCategoriesModal] = useState(false)

  const [addDocumentModal, setAddDocumentModal] = useState(false)

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Document Repository</span>
        <div className="flex items-center gap-4">
          <Button
            label="Document Categories"
            onClick={() => setDocumentCategoriesModal(true)}
            type="blue"
          />
          <Button
            label="Add New Document"
            onClick={() => {
              setDocumentEditData(null)
              setAddDocumentModal(true)
            }}
            type="black"
          />
        </div>
      </div>

      <DocumentCategoriesModal
        opened={documentCategoriesModal}
        setOpened={setDocumentCategoriesModal}
        categories={categories}
        isCategoriesLoading={isCategoriesLoading}
      />

      <AddDocumentModal
        opened={addDocumentModal}
        setOpened={setAddDocumentModal}
        categories={categories}
      />

      <div className="flex items-center bg-surface shadow p-4 rounded w-full justify-between">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search document"
        />
        <InputSelect
          placeholder="Select Category"
          searchable
          clearable
          data={categories.map((cat) => {
            return {
              label: cat.DocumentCategoryName,
              value: cat.DocumentCategoryId,
            }
          })}
          value={categoryId}
          onChange={(e) => setCategoryId(e as string)}
        />
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-start">
              Document Name
            </th>
            <th className="uppercase px-4 py-2 w-[50%] text-start">URL</th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">Category</th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">Created At</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={4}>
                <NoSearchResult text="No document" />
              </td>
            </tr>
          ) : (
            data.map((doc) => {
              return (
                <tr key={doc.DocumentId} className="cursor-pointer">
                  <td
                    onClick={() => {
                      setDocumentEditData(doc as unknown as IDocument)
                      setAddDocumentModal(true)
                    }}
                    className="align-top px-4 py-2 text-start"
                  >
                    <span className="line-clamp-2">{doc.DocumentName}</span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    {' '}
                    <a
                      href={doc.DocumentUrl}
                      target="_blank"
                      className="line-clamp-3 text-textPrimaryBlue cursor-pointer"
                    >
                      {doc.DocumentUrl}
                    </a>
                  </td>
                  <td
                    onClick={() => {
                      setDocumentEditData(doc as unknown as IDocument)
                      setAddDocumentModal(true)
                    }}
                    className="align-top px-4 py-2 text-end"
                  >
                    {' '}
                    <span className="line-clamp-2">
                      {doc.DocumentCategoryName}
                    </span>
                  </td>
                  <td
                    onClick={() => {
                      setDocumentEditData(doc as unknown as IDocument)
                      setAddDocumentModal(true)
                    }}
                    className="align-top px-4 py-2 text-end"
                  >
                    <span className="line-clamp-2">
                      {formatDate(doc.DocumentCreatedAt, 'DD MMM-YY hh:mm A')}
                    </span>
                  </td>
                </tr>
              )
            })
          )}
          <tr ref={ref}>
            <td colSpan={4}>
              {(isLoading || isFetchingNextPage) &&
                Array.from({ length: 10 }).map((_, idx) => (
                  <TableShimmer key={idx} />
                ))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default DocumentRepository
