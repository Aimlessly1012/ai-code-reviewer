import { readFileSync } from "fs";
import { HfInference } from "@huggingface/inference";
import { getOctokit } from "@actions/github";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 检查 API 密钥是否存在
if (!process.env.HUGGINGFACE_API_KEY) {
  console.error("错误: HUGGINGFACE_API_KEY 环境变量未设置");
  console.error("请在 .env 文件中设置 HUGGINGFACE_API_KEY");
  process.exit(1);
}

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const octokit = getOctokit(process.env.GITHUB_TOKEN!);

async function reviewCode(filePath: string) {
  try {
    const content = readFileSync(filePath, "utf-8");

    const response = await hf.textGeneration({
      model: "deepseek-ai/deepseek-coder-6.7b-base",
      inputs: `你是一个专业的代码审查员。请对提供的代码进行审查，重点关注：
1. 代码质量
2. 潜在的bug
3. 性能问题
4. 安全隐患
5. 代码风格
6. 最佳实践

请按照以下格式输出审查结果：
1. 代码质量评分（1-10分）
2. 主要问题列表
3. 改进建议
4. 总结

代码文件：${filePath}
代码内容：
${content}`,
      parameters: {
        max_new_tokens: 1000,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.1,
      },
    });

    const review = response.generated_text;

    // 在PR中创建评论
    await octokit.rest.issues.createComment({
      owner: process.env.GITHUB_REPOSITORY!.split("/")[0],
      repo: process.env.GITHUB_REPOSITORY!.split("/")[1],
      issue_number: parseInt(process.env.GITHUB_REF!.split("/")[2]),
      body: `## AI Code Review for ${filePath}\n\n${review}`,
    });

    // 检查评分，如果低于6分则标记为失败
    const scoreMatch = review.match(/代码质量评分：(\d+)/);
    if (scoreMatch && parseInt(scoreMatch[1]) < 6) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error reviewing ${filePath}:`, error);
    process.exit(1);
  }
}

// 获取命令行参数中的文件路径
const filePath = process.argv[2];
if (!filePath) {
  console.error("Please provide a file path");
  process.exit(1);
}

reviewCode(filePath);
