import noResultFoundImg from "../../public/assets/no_result.svg";

interface NoSearchResultProps {
  imgWidth?: string;
  textSize?: string;
  text?: string;
}

const NoSearchResult = ({
  imgWidth = "120px",
  textSize = "18px",
  text = "No result found",
}: NoSearchResultProps) => {
  return (
    <div className="flex flex-col w-full  gap-4 items-center justify-center h-full p-8 min-h-full">
      <div className="flex justify-center items-center">
        <img
          src={noResultFoundImg}
          alt="No Search Result"
          style={{ width: imgWidth }}
        />
      </div>
      <div
        style={{ fontSize: textSize }}
        className={`font-semibold font-sfProTextSemibold text-textTertiary`}
      >
        {text}
      </div>
    </div>
  );
};

export default NoSearchResult;
