import React, { useEffect, useState } from "react";
import Dialog from "../../../common/Dialog";
import InputWithTopHeader from "../../../common/inputs/InputWithTopHeader";
import InputSelect from "../../../common/inputs/InputSelect";
import { IDocumentCategories } from "../../../@types/database";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import DbCompany from "../../../firebase_configs/DB/DbCompany";
import { useAuthState, useEditFormStore } from "../../../store";
import CustomError, { errorHandler } from "../../../utilities/CustomError";
import { REACT_QUERY_KEYS } from "../../../@types/enum";
import { useQueryClient } from "@tanstack/react-query";
import { openContextModal } from "@mantine/modals";

const AddDocumentModal = ({
  opened,
  setOpened,
  categories,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  categories: IDocumentCategories[];
}) => {
  const { documentEditData, setDocumentEditData } = useEditFormStore();

  const isEdit = !!documentEditData;

  const { company } = useAuthState();

  const [categoryId, setCategoryId] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [document, setDocument] = useState<File | string>("");

  const [loading, setLoading] = useState(false);

  const handlePdfChange = (file: File) => {
    if (file.size > 200000) {
      showSnackbar({
        message: "File size must be less than 200kb",
        type: "error",
      });
      return;
    }
    setDocument(file);
  };

  const queryClient = useQueryClient();

  const resetForm = () => {
    setCategoryId("");
    setDocument("");
    setDocumentName("");
  };

  const onSubmit = async () => {
    if (!company) return;

    const categoryName =
      categories.find((cat) => cat.DocumentCategoryId === categoryId)
        ?.DocumentCategoryName || null;
    try {
      if (!categoryId || !categoryName) {
        throw new CustomError("Please select document category");
      }

      if (!documentName) {
        throw new CustomError("Please enter document name");
      }

      setLoading(true);

      if (isEdit) {
        await DbCompany.updateDocument({
          data: { categoryId, categoryName, document, documentName },
          documentId: documentEditData.DocumentId,
        });
      } else {
        if (!document || typeof document === "string") {
          throw new CustomError("Please upload document");
        }

        await DbCompany.addDocument({
          cmpId: company.CompanyId,
          data: {
            categoryId,
            categoryName,
            document,
            documentName,
          },
        });
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.DOCUMENT_LIST],
      });

      resetForm();
      setDocumentEditData(null);

      setLoading(false);
      setOpened(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
      errorHandler(error);
    }
  };

  const onDelete = async () => {
    if (!isEdit) return;
    try {
      setLoading(true);

      await DbCompany.deleteDocument(documentEditData.DocumentId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.DOCUMENT_LIST],
      });

      resetForm();
      setDocumentEditData(null);
      setLoading(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
    }
  };

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

  //*To populate editData in all the inputs

  useEffect(() => {
    if (isEdit) {
      const { DocumentCategoryId, DocumentName, DocumentUrl } =
        documentEditData;

      setCategoryId(DocumentCategoryId);
      setDocumentName(DocumentName);
      setDocument(DocumentUrl);
      return;
    }
    resetForm();
  }, [documentEditData, isEdit]);

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Add document"
      isFormModal={true}
      positiveCallback={onSubmit}
      negativeCallback={() =>
        isEdit
          ? openContextModal({
              modal: "confirmModal",
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: "Confirm",
                body: "Are you sure to delete this branch",
                onConfirm: () => {
                  onDelete();
                },
                onCancel: () => {
                  setOpened(true);
                },
              },
              size: "30%",
              styles: {
                body: { padding: "0px" },
              },
            })
          : setOpened(false)
      }
      negativeLabel={isEdit ? "Delete" : "Cancel"}
      positiveLabel={isEdit ? "Update" : "Save"}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <InputWithTopHeader
            className="mx-0"
            label="Document name"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
          />
          <InputSelect
            label="Document category"
            placeholder="Select Category"
            searchable
            clearable
            data={categories.map((cat) => {
              return {
                label: cat.DocumentCategoryName,
                value: cat.DocumentCategoryId,
              };
            })}
            value={categoryId}
            onChange={(e) => setCategoryId(e as string)}
          />

          <label
            htmlFor="fileUpload"
            className=" items-center gap-4 col-span-2 grid grid-cols-2"
          >
            {isEdit && <div className="font-semibold">Upload new file</div>}
            <input
              id="fileUpload"
              type="file"
              accept="application/pdf"
              className={`border border-gray-300 p-2 rounded `}
              onChange={(e) => handlePdfChange(e.target.files?.[0] as File)}
            />
          </label>
        </div>
      </div>
    </Dialog>
  );
};

export default AddDocumentModal;
